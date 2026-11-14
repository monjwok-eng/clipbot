import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Readable } from "stream";
import { fileURLToPath } from "url";
import os from "os";
import { createRequire } from 'module';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import Stripe from "stripe";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config();

function getR2Client(): S3Client | null {
  let accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId || accountId.startsWith('cfut_')) {
    accountId = "32143cfd2e67a3f632ebd77012172941";
  }
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "9921230f475bf0756a6d20f29a1b489b";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "7e15a7eb5415f1ca7424ffad9135181cf1ce002a913732d3b31955b6b2f2cff6";
  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key, { apiVersion: '2026-08-26.dahlia' as any });
  }
  return stripeClient;
}

const require = createRequire(import.meta.url);
const firebaseConfig = require('./firebase-applet-config.json');

// Initialize Firebase Admin (Auth & Firestore integration)
try {
  initializeApp({
    credential: applicationDefault(),
    projectId: firebaseConfig.projectId,
  });
} catch (e) {
  try {
    initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } catch (initErr) {
    console.error("Firebase Admin already initialized or init warning:", initErr);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Strict token verification for protected operations (e.g. Stripe checkout)
const verifyToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (e) {
    console.error("Token verification error:", e);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Optional token verification for uploads (supports guest & anonymous users seamlessly)
const optionalVerifyToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      (req as any).user = decodedToken;
    } catch (e) {
      // Allow guests / anonymous uploads even if token verification has a transient issue
      console.warn("Optional token verification notice:", e);
    }
  }
  next();
};

// Dedicated uploads storage directory (independent of external cloud storage)
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage setup directly saving into server uploads directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${uniqueSuffix}-${base}${ext}`);
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // Up to 100MB per file
});

// Stripe webhook endpoint (requires raw body)
app.post("/api/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret && sig) {
      event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = JSON.parse(req.body.toString()) as Stripe.Event;
    }
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const clientRefId = session.client_reference_id;
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

    if (clientRefId) {
      try {
        const fullSession = await getStripe().checkout.sessions.retrieve(session.id, {
          expand: ['line_items', 'line_items.data.price']
        });

        let tier = 'pro';
        const lineItems = fullSession.line_items?.data || [];
        for (const item of lineItems) {
          const priceObj = item.price;
          const priceId = typeof priceObj === 'string' ? priceObj : priceObj?.id;
          const productId = typeof priceObj === 'object' ? (typeof priceObj?.product === 'string' ? priceObj.product : priceObj?.product?.id) : undefined;
          if (productId === 'prod_VW9oydwY1fS9Oh' || priceId === 'price_1UTLRhFslIabHAR8lfuTN4fl') {
            tier = 'promax';
            break;
          }
        }

        const dbAdmin = getFirestore();
        const userRef = dbAdmin.collection('users').doc(clientRefId);
        await userRef.set({
          tier: tier,
          stripeCustomerId: customerId || null,
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`Webhook: Successfully synced user ${clientRefId} to tier ${tier}`);
      } catch (e) {
        console.error("Webhook processing error for user sync:", e);
      }
    }
  }

  res.json({ received: true });
});

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", storage: "server-hosted" });
});

app.get("/api/time", (req, res) => {
  res.json({ time: Date.now() });
});

app.post("/api/create-checkout-session", verifyToken, async (req, res) => {
  try {
    let { priceId } = req.body;
    const user = (req as any).user;
    if (!priceId) {
      return res.status(400).json({ error: "Invalid price or product ID" });
    }

    const stripe = getStripe();

    // If client passed a Product ID (prod_...), look up its active Price ID from Stripe
    if (priceId.startsWith('prod_')) {
      const prices = await stripe.prices.list({ product: priceId, active: true, limit: 1 });
      if (prices.data.length > 0) {
        priceId = prices.data[0].id;
      } else {
        return res.status(400).json({ error: `No active price found for product ${priceId}` });
      }
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const successUrl = `${protocol}://${host}/?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${protocol}://${host}/?payment=cancel`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      client_reference_id: user.uid,
      customer_email: user.email || undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    res.json({ url: session.url, id: session.id });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/verify-checkout-session", verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const authUser = (req as any).user;
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID required" });
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price']
    });

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return res.status(400).json({ error: "Session not paid or completed yet" });
    }

    const clientRefId = session.client_reference_id;
    if (clientRefId && clientRefId !== authUser.uid) {
      return res.status(403).json({ error: "Unauthorized session mapping" });
    }

    const targetUid = clientRefId || authUser.uid;
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

    // Determine tier from price or product ID
    let tier = 'pro';
    const lineItems = session.line_items?.data || [];
    for (const item of lineItems) {
      const priceObj = item.price;
      const priceId = typeof priceObj === 'string' ? priceObj : priceObj?.id;
      const productId = typeof priceObj === 'object' ? (typeof priceObj?.product === 'string' ? priceObj.product : priceObj?.product?.id) : undefined;
      if (productId === 'prod_VW9oydwY1fS9Oh' || priceId === 'price_1UTLRhFslIabHAR8lfuTN4fl') {
        tier = 'promax';
        break;
      }
    }

    const dbAdmin = getFirestore();
    const userRef = dbAdmin.collection('users').doc(targetUid);
    await userRef.set({
      tier: tier,
      stripeCustomerId: customerId || null,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    res.json({ success: true, tier, customerId });
  } catch (err: any) {
    console.error("Verify Checkout Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/sync-user-subscription", verifyToken, async (req, res) => {
  try {
    const authUser = (req as any).user;
    if (!authUser.email) {
      return res.status(400).json({ error: "Email required for sync" });
    }

    const stripe = getStripe();

    // 1. Search for Customer by email
    const customers = await stripe.customers.search({
      query: `email:'${authUser.email}'`,
    });

    if (customers.data.length === 0) {
      return res.json({ synced: false, message: "Customer not found" });
    }

    const customerId = customers.data[0].id;

    // 2. Retrieve active subscriptions for that customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      expand: ['data.plan.product']
    });

    let tier = 'free';
    
    // 3. Determine highest tier
    for (const sub of subscriptions.data) {
      for (const item of sub.items.data) {
        const productId = typeof item.plan.product === 'string' ? item.plan.product : item.plan.product.id;
        if (productId === 'prod_VW9oydwY1fS9Oh') {
          tier = 'promax';
          break;
        } else if (productId === 'prod_VW9nObZEF3Z6xE') {
          tier = 'pro';
        }
      }
      if (tier === 'promax') break;
    }

    // 4. Sync Firestore
    const dbAdmin = getFirestore();
    const userRef = dbAdmin.collection('users').doc(authUser.uid);
    await userRef.set({
      tier: tier,
      stripeCustomerId: customerId,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    res.json({ synced: true, tier, customerId });
  } catch (err: any) {
    console.error("Sync Subscription Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to generate Cloudflare R2 / S3 Presigned Upload URLs (Bypasses Node.js server for uploads)
app.post("/api/get-upload-url", optionalVerifyToken, async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    if (!fileName) {
      return res.status(400).json({ error: "fileName is required" });
    }

    const r2 = getR2Client();
    let bucketName = process.env.R2_BUCKET_NAME || process.env.S3_BUCKET_NAME;
    if (!bucketName || bucketName === "R2 User Token") {
      bucketName = "sendarro-uploads";
    }

    if (r2 && bucketName) {
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const fileKey = `clips/${Date.now()}-${Math.round(Math.random() * 1e9)}-${sanitizedName}`;
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        ContentType: fileType || "application/octet-stream",
      });

      // Presigned URL valid for 1 hour (3600 seconds) to support large uploads up to 2GB
      const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

      // Presigned GET download URL with attachment header (valid for 7 days)
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        ResponseContentDisposition: `attachment; filename="${encodeURIComponent(sanitizedName)}"`,
      });
      const presignedDownloadUrl = await getSignedUrl(r2, getCommand, { expiresIn: 604800 });

      const publicDomain = process.env.R2_PUBLIC_DOMAIN || process.env.R2_DEV_URL || "";
      const publicUrl = publicDomain 
        ? `${publicDomain.replace(/\/$/, '')}/${fileKey}` 
        : presignedDownloadUrl;

      return res.json({ 
        directR2: true, 
        uploadUrl, 
        fileKey, 
        publicUrl 
      });
    }

    // Return directR2: false if R2 credentials are not configured, enabling client fallback
    return res.json({ directR2: false });
  } catch (err: any) {
    console.error("Presigned URL Generation Error:", err);
    res.status(500).json({ error: err.message || "Failed to generate presigned upload URL" });
  }
});

// Endpoint to generate an on-demand presigned GET download URL for any R2 file
app.all(["/api/get-download-url", "/api/download"], async (req, res) => {
  try {
    const keyParam = (req.query?.key || req.query?.fileKey || req.body?.key || req.body?.fileKey) as string;
    const nameParam = (req.query?.fileName || req.query?.filename || req.body?.fileName || req.body?.filename) as string;
    const urlParam = (req.query?.url || req.body?.url) as string;

    let fileKey = keyParam;
    if (!fileKey && urlParam) {
      const match = urlParam.match(/clips\/[^?]+/);
      if (match) fileKey = match[0];
    }

    if (!fileKey) {
      return res.status(400).json({ error: "fileKey or url is required" });
    }

    const r2 = getR2Client();
    let bucketName = process.env.R2_BUCKET_NAME || process.env.S3_BUCKET_NAME || "sendarro-uploads";
    if (bucketName === "R2 User Token") bucketName = "sendarro-uploads";

    if (!r2) {
      return res.status(500).json({ error: "Storage client not available" });
    }

    const fileName = nameParam || fileKey.split('/').pop() || 'download';
    const sanitizedName = String(fileName).replace(/[^a-zA-Z0-9_.-]/g, "_");

    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(sanitizedName)}"`,
    });

    const downloadUrl = await getSignedUrl(r2, getCommand, { expiresIn: 604800 });

    if (req.query?.redirect === "true") {
      return res.redirect(downloadUrl);
    }

    return res.json({ downloadUrl, fileKey, fileName: sanitizedName });
  } catch (err: any) {
    console.error("Get download URL error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate download URL" });
  }
});

// Server-side Google Drive Document and File Exporter (prevents CORS & corrupt files)
app.post("/api/export-drive-file", async (req, res) => {
  res.setHeader("Access-Control-Expose-Headers", "X-File-Name, X-File-Type, Content-Disposition");
  try {
    const { fileId, accessToken, mimeType, fileName } = req.body || {};

    if (!fileId || !accessToken) {
      return res.status(400).json({ error: "fileId and accessToken are required" });
    }

    const isGoogleDoc = mimeType && mimeType.startsWith("application/vnd.google-apps.");

    let targetUrl: string;
    let targetMime = "application/octet-stream";
    let targetExt = "";

    if (isGoogleDoc) {
      if (mimeType === "application/vnd.google-apps.document") {
        targetMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        targetExt = ".docx";
      } else if (mimeType === "application/vnd.google-apps.spreadsheet") {
        targetMime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        targetExt = ".xlsx";
      } else if (mimeType === "application/vnd.google-apps.presentation") {
        targetMime = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        targetExt = ".pptx";
      } else {
        targetMime = "application/pdf";
        targetExt = ".pdf";
      }
      targetUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(targetMime)}`;
    } else {
      targetUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      targetMime = mimeType || "application/octet-stream";
    }

    let gRes = await fetch(targetUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      redirect: "follow",
    });

    if (!gRes.ok && isGoogleDoc && targetMime !== "application/pdf") {
      targetMime = "application/pdf";
      targetExt = ".pdf";
      targetUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`;
      gRes = await fetch(targetUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        redirect: "follow",
      });
    }

    if (!gRes.ok) {
      const errText = await gRes.text().catch(() => "");
      return res.status(gRes.status).json({
        error: `Google Drive returned HTTP ${gRes.status}: ${errText.slice(0, 300)}`
      });
    }

    const arrayBuffer = await gRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const firstChars = buffer.subarray(0, 30).toString("utf8").trim();
    if (firstChars.startsWith("<!DOCTYPE") || firstChars.startsWith("<html") || firstChars.startsWith('{"error"')) {
      return res.status(400).json({
        error: `Invalid file content received from Google Drive: ${buffer.subarray(0, 200).toString("utf8")}`
      });
    }

    let finalName = fileName || "google-document";
    if (targetExt && !finalName.toLowerCase().endsWith(targetExt)) {
      finalName = `${finalName}${targetExt}`;
    }
    const sanitizedName = String(finalName).replace(/[^a-zA-Z0-9_.-]/g, "_");

    res.setHeader("Content-Type", targetMime);
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(sanitizedName)}"`);
    res.setHeader("X-File-Name", encodeURIComponent(sanitizedName));
    res.setHeader("X-File-Type", targetMime);

    return res.status(200).send(buffer);
  } catch (err: any) {
    console.error("export-drive-file error:", err);
    return res.status(500).json({ error: err.message || "Failed to export Google Drive file" });
  }
});

// --- Webhook & Cloud Export Helpers ---

function isSafePublicWebhookUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function formatBytesServer(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

async function dispatchWebhookNotification(
  webhookUrl: string,
  payload: {
    event: 'collection.submission' | 'collection.test';
    code: string;
    collectionTitle: string;
    contributorName: string;
    fileCount: number;
    totalBytes: number;
    files: Array<{ fileName: string; fileSize?: number }>;
    inboxUrl: string;
    submittedAt: string;
  }
): Promise<void> {
  const host = new URL(webhookUrl).hostname.toLowerCase();
  const formattedSize = formatBytesServer(payload.totalBytes);
  const isTest = payload.event === 'collection.test';
  const title = isTest
    ? `Test Alert: ${payload.collectionTitle}`
    : `New Submission in "${payload.collectionTitle}"`;
  const summaryLine = isTest
    ? `Your Sendarro Collection Box (${payload.code}) webhook is connected and ready.`
    : `${payload.contributorName} uploaded ${payload.fileCount} ${payload.fileCount === 1 ? 'file' : 'files'} (${formattedSize}).`;

  let body: any;

  if (host.includes('discord.com') || host.includes('discordapp.com')) {
    body = {
      username: 'Sendarro',
      embeds: [
        {
          title,
          description: summaryLine,
          color: isTest ? 0x059669 : 0x1d4ed8,
          fields: [
            { name: 'Collection Code', value: payload.code || 'PREVIEW', inline: true },
            { name: 'Contributor', value: payload.contributorName, inline: true },
            { name: 'Payload', value: `${payload.fileCount} files (${formattedSize})`, inline: true },
          ],
          url: payload.inboxUrl || undefined,
          timestamp: payload.submittedAt,
        },
      ],
    };
  } else if (host.includes('hooks.slack.com')) {
    body = {
      text: `${title} — ${summaryLine} (${payload.inboxUrl})`,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: title.slice(0, 150) },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${summaryLine}\n*Code:* \`${payload.code || 'PREVIEW'}\`${payload.inboxUrl ? `\n<${payload.inboxUrl}|Open Inbox in Sendarro>` : ''}`,
          },
        },
      ],
    };
  } else if (host.includes('webhook.office.com') || host.includes('logic.azure.com')) {
    body = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: isTest ? '059669' : '1D4ED8',
      summary: title,
      sections: [
        {
          activityTitle: title,
          activitySubtitle: summaryLine,
          facts: [
            { name: 'Collection Code', value: payload.code || 'PREVIEW' },
            { name: 'Contributor', value: payload.contributorName },
            { name: 'Files', value: `${payload.fileCount} (${formattedSize})` },
          ],
        },
      ],
    };
  } else {
    body = {
      event: payload.event,
      code: payload.code,
      collectionTitle: payload.collectionTitle,
      contributorName: payload.contributorName,
      fileCount: payload.fileCount,
      totalBytes: payload.totalBytes,
      formattedSize,
      files: payload.files,
      inboxUrl: payload.inboxUrl,
      submittedAt: payload.submittedAt,
    };
  }

  const webhookRes = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!webhookRes.ok) {
    const errText = await webhookRes.text().catch(() => '');
    throw new Error(`Webhook endpoint returned HTTP ${webhookRes.status}: ${errText.slice(0, 200)}`);
  }
}

app.post("/api/test-webhook", verifyToken, async (req, res) => {
  try {
    const { webhookUrl, collectionTitle, code } = req.body || {};
    if (!webhookUrl || typeof webhookUrl !== 'string' || !isSafePublicWebhookUrl(webhookUrl)) {
      return res.status(400).json({ error: "Please enter a valid public https:// Slack, Discord, or Webhook URL." });
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const origin = host ? `${protocol}://${host}` : '';

    await dispatchWebhookNotification(webhookUrl.trim(), {
      event: 'collection.test',
      code: code || 'PREVIEW',
      collectionTitle: (collectionTitle && String(collectionTitle).trim()) || 'My Collection Box',
      contributorName: 'Sendarro Test',
      fileCount: 1,
      totalBytes: 1024 * 1024,
      files: [{ fileName: 'sample-submission.pdf', fileSize: 1024 * 1024 }],
      inboxUrl: code ? `${origin}/?code=${encodeURIComponent(code)}` : origin,
      submittedAt: new Date().toISOString(),
    });

    return res.json({ success: true });
  } catch (err: any) {
    console.error("Test webhook error:", err);
    return res.status(502).json({ error: err.message || "Failed to deliver test webhook." });
  }
});

app.post("/api/notify-collection-webhook", async (req, res) => {
  try {
    const { code, contributorName, fileCount, totalBytes, files, submittedAt } = req.body || {};
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: "Collection code is required" });
    }

    const dbAdmin = getFirestore();
    const [clipSnap, settingsSnap] = await Promise.all([
      dbAdmin.collection('clips').doc(code).get(),
      dbAdmin.collection('clips').doc(code).collection('private').doc('settings').get(),
    ]);

    if (!clipSnap.exists) {
      return res.json({ notified: false, reason: 'clip_not_found' });
    }

    const clipData = clipSnap.data() || {};
    const settingsData = settingsSnap.exists ? settingsSnap.data() || {} : {};
    const webhookUrl = settingsData.webhookUrl;

    if (!webhookUrl || typeof webhookUrl !== 'string' || !isSafePublicWebhookUrl(webhookUrl)) {
      return res.json({ notified: false });
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const origin = host ? `${protocol}://${host}` : '';

    await dispatchWebhookNotification(webhookUrl.trim(), {
      event: 'collection.submission',
      code,
      collectionTitle: clipData.content || `Collection ${code}`,
      contributorName: contributorName || 'Anonymous Contributor',
      fileCount: Number(fileCount) || (Array.isArray(files) ? files.length : 0),
      totalBytes: Number(totalBytes) || 0,
      files: Array.isArray(files) ? files : [],
      inboxUrl: `${origin}/?code=${encodeURIComponent(code)}`,
      submittedAt: submittedAt || new Date().toISOString(),
    });

    return res.json({ notified: true });
  } catch (err: any) {
    console.warn("Collection webhook dispatch notice:", err?.message || err);
    return res.json({ notified: false, error: err?.message || 'Webhook delivery failed' });
  }
});

async function findOrCreateDriveFolder(
  driveToken: string,
  folderName: string,
  parentId?: string
): Promise<{ id: string; webViewLink?: string }> {
  const safeName = folderName.replace(/[\\/:*?"<>|]/g, '_').trim() || 'Sendarro Export';
  const escaped = safeName.replace(/'/g, "\\'");
  let q = `mimeType = 'application/vnd.google-apps.folder' and trashed = false and name = '${escaped}'`;
  if (parentId) {
    q += ` and '${parentId}' in parents`;
  }

  const searchUrl = new URL('https://www.googleapis.com/drive/v3/files');
  searchUrl.searchParams.set('q', q);
  searchUrl.searchParams.set('fields', 'files(id,name,webViewLink)');
  searchUrl.searchParams.set('pageSize', '1');

  const searchRes = await fetch(searchUrl.toString(), {
    headers: { Authorization: `Bearer ${driveToken}` },
  });

  if (searchRes.status === 401) {
    const authErr: any = new Error('Google Drive session expired. Please reconnect your Drive account.');
    authErr.status = 401;
    throw authErr;
  }

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (Array.isArray(searchData.files) && searchData.files.length > 0) {
      return {
        id: searchData.files[0].id,
        webViewLink: searchData.files[0].webViewLink || `https://drive.google.com/drive/folders/${searchData.files[0].id}`,
      };
    }
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${driveToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: safeName,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {}),
    }),
  });

  if (createRes.status === 401) {
    const authErr: any = new Error('Google Drive session expired. Please reconnect your Drive account.');
    authErr.status = 401;
    throw authErr;
  }

  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => '');
    throw new Error(`Failed to create Drive folder "${safeName}": ${errText.slice(0, 200)}`);
  }

  const created = await createRes.json();
  return {
    id: created.id,
    webViewLink: created.webViewLink || `https://drive.google.com/drive/folders/${created.id}`,
  };
}

// Cloud-to-Google-Drive Inbox Exporter (streams files directly to Drive with user's Bearer token)
app.post("/api/import-to-drive", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Google Drive authorization token required.' });
    }
    const driveToken = authHeader.slice('Bearer '.length).trim();
    if (!driveToken) {
      return res.status(401).json({ error: 'Google Drive authorization token required.' });
    }

    const { folderName, code, entries } = req.body || {};
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'No files provided to export.' });
    }

    const rootTitle = (folderName && String(folderName).trim()) || (code ? `Collection ${code}` : 'Sendarro Inbox');
    const rootFolderName = code && !rootTitle.includes(code)
      ? `Sendarro - ${rootTitle} (${code})`
      : `Sendarro - ${rootTitle}`;

    const rootFolder = await findOrCreateDriveFolder(driveToken, rootFolderName);
    const subfolderCache = new Map<string, string>();

    let uploadedCount = 0;
    const errors: string[] = [];

    for (const entry of entries) {
      const rawFileName = (entry?.fileName && String(entry.fileName).trim()) || 'file';
      const contributorName = entry?.contributorFolder ? String(entry.contributorFolder).trim() : '';
      const mimeType = entry?.mimeType || 'application/octet-stream';
      const rawUrl = entry?.downloadUrl ? String(entry.downloadUrl) : '';

      if (!rawUrl) {
        errors.push(`${rawFileName}: missing download URL`);
        continue;
      }

      try {
        let targetParentId = rootFolder.id;
        if (contributorName) {
          const cachedId = subfolderCache.get(contributorName);
          if (cachedId) {
            targetParentId = cachedId;
          } else {
            const sub = await findOrCreateDriveFolder(driveToken, contributorName, rootFolder.id);
            subfolderCache.set(contributorName, sub.id);
            targetParentId = sub.id;
          }
        }

        let streamBody: any = null;
        let contentLength: number | null = null;

        // Check if hosted locally in Express uploadsDir (/api/files/:fileId/...)
        const localMatch = rawUrl.match(/\/api\/files\/([^/?]+)/);
        if (localMatch) {
          const fileId = path.basename(decodeURIComponent(localMatch[1]));
          const filePath = path.join(uploadsDir, fileId);
          if (!fs.existsSync(filePath)) {
            throw new Error('Local file expired or unavailable');
          }
          const stat = fs.statSync(filePath);
          contentLength = stat.size;
          streamBody = Readable.toWeb(fs.createReadStream(filePath));
        } else {
          let sourceUrl = rawUrl;
          if (sourceUrl.includes('cloudflarestorage.com') && !sourceUrl.includes('X-Amz-Signature')) {
            const matchKey = sourceUrl.match(/clips\/[^?]+/);
            const r2 = getR2Client();
            let bucketName = process.env.R2_BUCKET_NAME || process.env.S3_BUCKET_NAME || "sendarro-uploads";
            if (bucketName === "R2 User Token") bucketName = "sendarro-uploads";
            if (r2 && matchKey) {
              const sanitizedName = rawFileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
              const getCommand = new GetObjectCommand({
                Bucket: bucketName,
                Key: matchKey[0],
                ResponseContentDisposition: `attachment; filename="${encodeURIComponent(sanitizedName)}"`,
              });
              sourceUrl = await getSignedUrl(r2, getCommand, { expiresIn: 3600 });
            }
          }

          const upstreamRes = await fetch(sourceUrl);
          if (!upstreamRes.ok || !upstreamRes.body) {
            throw new Error(`Source file returned HTTP ${upstreamRes.status}`);
          }
          const headerLen = upstreamRes.headers.get('content-length');
          if (headerLen && Number.isFinite(Number(headerLen))) {
            contentLength = Number(headerLen);
          }
          streamBody = upstreamRes.body;
        }

        // Start Google Drive resumable upload session
        const initHeaders: Record<string, string> = {
          Authorization: `Bearer ${driveToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': mimeType,
        };
        if (contentLength !== null) {
          initHeaders['X-Upload-Content-Length'] = String(contentLength);
        }

        const initRes = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink',
          {
            method: 'POST',
            headers: initHeaders,
            body: JSON.stringify({
              name: rawFileName,
              parents: [targetParentId],
            }),
          }
        );

        if (initRes.status === 401) {
          const authErr: any = new Error('Google Drive session expired. Please reconnect your Drive account.');
          authErr.status = 401;
          throw authErr;
        }

        if (!initRes.ok) {
          const errText = await initRes.text().catch(() => '');
          throw new Error(`Drive upload init failed (${initRes.status}): ${errText.slice(0, 180)}`);
        }

        const uploadUri = initRes.headers.get('location');
        if (!uploadUri) {
          throw new Error('Missing Google Drive resumable upload URL');
        }

        const putHeaders: Record<string, string> = {
          'Content-Type': mimeType,
        };
        if (contentLength !== null) {
          putHeaders['Content-Length'] = String(contentLength);
        }

        const putRes = await fetch(uploadUri, {
          method: 'PUT',
          headers: putHeaders,
          body: streamBody,
          duplex: 'half',
        } as any);

        if (!putRes.ok) {
          const errText = await putRes.text().catch(() => '');
          throw new Error(`Drive upload failed (${putRes.status}): ${errText.slice(0, 180)}`);
        }

        uploadedCount += 1;
      } catch (fileErr: any) {
        if (fileErr?.status === 401) {
          throw fileErr;
        }
        console.warn(`Drive import failed for ${rawFileName}:`, fileErr?.message || fileErr);
        errors.push(`${rawFileName}: ${fileErr?.message || 'upload failed'}`);
      }
    }

    if (uploadedCount === 0 && errors.length > 0) {
      return res.status(502).json({
        error: errors[0],
        errors,
        uploadedCount: 0,
        failedCount: errors.length,
      });
    }

    return res.json({
      success: true,
      uploadedCount,
      failedCount: errors.length,
      errors,
      folderId: rootFolder.id,
      folderUrl: rootFolder.webViewLink,
    });
  } catch (err: any) {
    console.error("import-to-drive error:", err);
    return res.status(err?.status || 500).json({
      error: err?.message || "Failed to export collection to Google Drive",
    });
  }
});

// Direct server-hosted file upload endpoint (NO Firebase Storage required)
app.post("/api/upload", optionalVerifyToken, upload.array("files", 10), async (req, res) => {
  try {
    const uploadedMulterFiles = req.files as Express.Multer.File[];
    if (!uploadedMulterFiles || uploadedMulterFiles.length === 0) {
      return res.status(400).json({ error: "No files received for upload" });
    }

    const fileInfos = [];

    for (const file of uploadedMulterFiles) {
      const fileId = file.filename;
      const originalName = file.originalname || 'download';
      const mimeType = file.mimetype || 'application/octet-stream';
      const size = file.size;

      // Persist metadata sidecar
      const metaPath = path.join(uploadsDir, `${fileId}.meta.json`);
      try {
        fs.writeFileSync(metaPath, JSON.stringify({
          originalName,
          mimetype: mimeType,
          size,
          uploadedAt: Date.now()
        }));
      } catch (metaErr) {
        console.warn("Failed to write metadata sidecar:", metaErr);
      }

      // Streamable direct download URL served by our Express server
      const downloadUrl = `/api/files/${encodeURIComponent(fileId)}/${encodeURIComponent(originalName)}`;

      fileInfos.push({
        fileName: originalName,
        fileType: mimeType,
        fileSize: size,
        downloadUrl: downloadUrl
      });
    }

    return res.json({ files: fileInfos });

  } catch (error: any) {
    console.error("In-route upload error:", error);
    return res.status(500).json({ 
      error: error.message || "File upload failed. Please try again." 
    });
  }
});

// Direct file serving & download endpoint
app.get(["/api/files/:fileId", "/api/files/:fileId/:filename"], (req, res) => {
  try {
    const rawFileId = req.params.fileId;
    if (!rawFileId) {
      return res.status(400).json({ error: "File ID is required" });
    }

    // Sanitize to prevent path traversal attacks
    const fileId = path.basename(rawFileId);
    const filePath = path.join(uploadsDir, fileId);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found or has expired." });
    }

    const metaPath = path.join(uploadsDir, `${fileId}.meta.json`);
    let originalName = req.params.filename || fileId;
    let mimetype = "application/octet-stream";

    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
        originalName = meta.originalName || originalName;
        mimetype = meta.mimetype || mimetype;
      } catch (e) {
        console.warn("Failed to parse file metadata:", e);
      }
    }

    // Set appropriate headers for file download and caching
    res.setHeader("Content-Type", mimetype);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(originalName)}"`);
    res.setHeader("Cache-Control", "public, max-age=86400");

    const stream = fs.createReadStream(filePath);
    stream.on("error", (err) => {
      console.error("File stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to stream file" });
      }
    });
    stream.pipe(res);
  } catch (err: any) {
    console.error("File retrieval error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal file retrieval error" });
    }
  }
});

// Periodic automated cleanup for expired files (7-day retention to cover Pro Max Vault reactivations)
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;
const MAX_FILE_AGE_MS = 7 * 24 * 60 * 60 * 1000;

setInterval(() => {
  try {
    if (!fs.existsSync(uploadsDir)) return;
    const now = Date.now();
    const allFiles = fs.readdirSync(uploadsDir);
    for (const file of allFiles) {
      const fullPath = path.join(uploadsDir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (now - stat.mtimeMs > MAX_FILE_AGE_MS) {
          fs.unlinkSync(fullPath);
        }
      } catch (fileErr) {
        // Continue cleaning other files
      }
    }
  } catch (cleanupErr) {
    console.warn("File cleanup cycle notice:", cleanupErr);
  }
}, CLEANUP_INTERVAL_MS);

// Error handler for API routes
app.use("/api", (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("API Error:", err);
  res.status(err.status || 500).json({ 
    error: err.message || "Internal Server Error",
    details: process.env.NODE_ENV !== "production" ? err.stack : undefined
  });
});

// 404 handler for API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
