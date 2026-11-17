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

// --- Cloud Export Helpers ---

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

// --- SEO Metadata, Sitemap & Semantic HTML Injection ---
function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getRequestBaseUrl(req: express.Request): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  const protoHeader = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const proto = protoHeader.split(',')[0].trim();
  const host = req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function getRouteSeoPayload(pathname: string, baseUrl: string) {
  const normalized = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const isProduct = normalized === '/product';
  const isPricing = normalized === '/pricing';

  const canonicalPath = isProduct ? '/product' : isPricing ? '/pricing' : '/';
  const canonicalUrl = `${baseUrl}${canonicalPath}`;

  const title = isProduct
    ? 'Sendarro Product — Collection Drop Boxes & Instant File Beaming'
    : isPricing
    ? 'Sendarro Pricing — Free Collection Trial, Pro & Pro Max'
    : 'Sendarro — Collection Drop Boxes & Instant File Sharing';

  const description = isProduct
    ? 'Discover Sendarro Collection Drop Boxes: gather homework, event media, and client files without logins, export in 1 click to ZIP or Drive, and share up to 2GB.'
    : isPricing
    ? 'Start free with 1 Trial Collection Box and 10MB sharing, upgrade to Pro ($4.99/mo) for 500MB transfers, or Pro Max ($9.99/mo) for unlimited Collection Boxes.'
    : 'Collect files from teammates, students, or clients in one organized inbox with zero contributor logins, or share text and files up to 2GB via 8-character codes.';

  const keywords = isProduct
    ? 'collection drop box, file collection inbox, client file request, teacher assignment dropbox, bulk zip export, google drive file intake, 7 day locked vault'
    : isPricing
    ? 'sendarro pricing, collection box pricing, file dropbox alternative pricing, 2gb file transfer plan, google drive batch export'
    : 'collection drop box, collect files without login, sendarro, file request link, 8 character file transfer, universal clipboard';

  const sharedOffers = [
    {
      '@type': 'Offer',
      name: 'Free Guest & Trial',
      price: '0',
      priceCurrency: 'USD',
      description: '10MB file limit, 10,000 character clips, and 1 Free Trial Collection Box (up to 5 submissions, 24h window).',
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '4.99',
      priceCurrency: 'USD',
      description: '500MB Cloudflare R2 transfers, 100,000 character clips, custom aliases, 24h expiry, and 1 Free Trial Collection Box.',
    },
    {
      '@type': 'Offer',
      name: 'Pro Max',
      price: '9.99',
      priceCurrency: 'USD',
      description: 'Unlimited Collection Drop Boxes & submissions, 2GB file ceiling, auto-closing deadlines, 1-click ZIP/Google Drive/Dropbox export, and 7-Day Locked Vault.',
    },
  ];

  const faqEntities = isPricing
    ? [
        {
          '@type': 'Question',
          name: 'Do contributors uploading to my Collection Box need a paid plan or account?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. Contributors never need a Sendarro account or subscription to upload files to your Collection Box.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the difference between Pro and Pro Max?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Pro ($4.99/mo) unlocks 500MB transfers, 100k character clips, custom aliases, and 24h expiry. Pro Max ($9.99/mo) adds Unlimited Collection Boxes, 2GB uploads, auto-closing deadlines, 1-click ZIP/Drive/Dropbox export, and the 7-Day Locked Vault.',
          },
        },
      ]
    : [
        {
          '@type': 'Question',
          name: 'How do Sendarro Collection Boxes work without contributor logins?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Create a Collection Box and share its 8-character code or QR link. Anyone can open the box, enter their name, and upload files directly without creating an account.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I try a Collection Box before upgrading to Pro Max?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Signed-in Google accounts receive 1 Free Trial Collection Box supporting up to 5 contributor submissions over a 24-hour window.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do 1-click ZIP, Google Drive, and Dropbox exports organize submissions?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Pro Max lets you download every submission in one ZIP archive, export directly into Google Drive sorted into contributor subfolders, or save straight to Dropbox.',
          },
        },
      ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Sendarro',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web, Windows, macOS, iOS, Android',
        url: canonicalUrl,
        description,
        offers: sharedOffers,
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqEntities,
      },
    ],
  };

  const semanticRootHtml = isProduct
    ? `<main data-seo-prerender="product">
        <header><nav aria-label="Primary"><a href="/">Transfer</a> | <a href="/product">Product</a> | <a href="/pricing">Pricing</a></nav></header>
        <section>
          <h1>Collect files from anyone into one organized inbox.</h1>
          <p>${escapeHtmlAttr(description)}</p>
          <h2>How Collection Drop Boxes Work</h2>
          <ol>
            <li>Open a Collection Box with 1 Free Trial Box (up to 5 submissions, 24h open) or unlimited boxes on Pro Max.</li>
            <li>Contributors upload files via 8-character code or QR link with zero login required.</li>
            <li>Export organized contributor submissions in 1 click as a ZIP archive, Google Drive subfolders, or Dropbox.</li>
          </ol>
          <h2>7-Day Locked Vault &amp; Instant Beaming</h2>
          <p>Pro Max protects expired clips and Collection Boxes inside your 7-Day Locked Vault with 15-minute link reactivation. Transfer text up to 100,000 characters and files up to 2 GB via Cloudflare R2.</p>
        </section>
        <section>
          <h2>Frequently Asked Questions</h2>
          <h3>How do Sendarro Collection Boxes work without contributor logins?</h3>
          <p>Share an 8-character code or QR link; contributors enter their name and upload files straight from desktop or mobile without creating an account.</p>
          <h3>Can I try a Collection Box before upgrading to Pro Max?</h3>
          <p>Yes. Every signed-in Google account gets 1 Free Trial Collection Box for up to 5 submissions over 24 hours.</p>
        </section>
      </main>`
    : isPricing
    ? `<main data-seo-prerender="pricing">
        <header><nav aria-label="Primary"><a href="/">Transfer</a> | <a href="/product">Product</a> | <a href="/pricing">Pricing</a></nav></header>
        <section>
          <h1>Simple plans built around Collection Drop Boxes</h1>
          <p>${escapeHtmlAttr(description)}</p>
          <h2>Plans &amp; Pricing</h2>
          <ul>
            <li><strong>Free ($0)</strong>: 1 Free Trial Collection Box (up to 5 submissions, 24h), 10 MB file transfer limit, 10,000 characters, QR beaming, ZIP download.</li>
            <li><strong>Pro ($4.99 / month)</strong>: 500 MB Cloudflare R2 file ceiling, 100,000 characters, custom alias codes, 15m–24h clip expiry, includes 1 Free Trial Collection Box.</li>
            <li><strong>Pro Max ($9.99 / month)</strong>: Unlimited Collection Drop Boxes &amp; submissions, 2 GB Cloudflare R2 file ceiling, auto-closing submission deadlines, 1-click ZIP / Google Drive subfolders / Dropbox export, and 7-Day Locked Vault with 15m reactivation.</li>
          </ul>
        </section>
        <section>
          <h2>Pricing &amp; Collection FAQ</h2>
          <h3>Do contributors uploading to my Collection Box need a paid plan or account?</h3>
          <p>No. Contributors never need a Sendarro account or subscription to upload files.</p>
          <h3>What is the difference between Pro and Pro Max?</h3>
          <p>Pro ($4.99/mo) unlocks 500 MB files, 100k chars, custom aliases, and 24h expiry. Pro Max ($9.99/mo) adds Unlimited Collection Boxes, 2 GB uploads, deadlines, 1-click ZIP/Drive/Dropbox batch exports, and the 7-Day Locked Vault.</p>
        </section>
      </main>`
    : `<main data-seo-prerender="home">
        <header><nav aria-label="Primary"><a href="/">Transfer</a> | <a href="/product">Product</a> | <a href="/pricing">Pricing</a></nav></header>
        <section>
          <h1>Sendarro — Collection Drop Boxes &amp; Instant File Sharing</h1>
          <p>${escapeHtmlAttr(description)}</p>
          <p>Free ($0 · 1 Trial Collection Box &amp; 10 MB transfers) · Pro ($4.99/mo · 500 MB &amp; 100k chars) · Pro Max ($9.99/mo · Unlimited Collection Boxes, 2 GB, Batch Drive/Dropbox/ZIP Export &amp; 7-Day Locked Vault).</p>
        </section>
      </main>`;

  return { title, description, keywords, canonicalUrl, ogImage: `${baseUrl}/sendarro-logo.png`, jsonLd, semanticRootHtml };
}

function injectSeoIntoHtml(rawHtml: string, req: express.Request): string {
  const baseUrl = getRequestBaseUrl(req);
  const seo = getRouteSeoPayload(req.path, baseUrl);
  const safeTitle = escapeHtmlAttr(seo.title);
  const safeDesc = escapeHtmlAttr(seo.description);
  const safeKeywords = escapeHtmlAttr(seo.keywords);
  const safeUrl = escapeHtmlAttr(seo.canonicalUrl);
  const safeImage = escapeHtmlAttr(seo.ogImage);

  let out = rawHtml
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${safeDesc}" />`)
    .replace(/<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/i, `<meta name="keywords" content="${safeKeywords}" />`)
    .replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${safeTitle}" />`)
    .replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${safeDesc}" />`)
    .replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${safeImage}" />`)
    .replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${safeTitle}" />`)
    .replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${safeDesc}" />`)
    .replace(/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${safeImage}" />`)
    .replace(
      /<script\s+id="sendarro-jsonld"\s+type="application\/ld\+json">[\s\S]*?<\/script>/i,
      `<script id="sendarro-jsonld" type="application/ld+json">${JSON.stringify(seo.jsonLd)}</script>`
    )
    .replace(
      /<div id="root"><\/div>/i,
      `<div id="root">${seo.semanticRootHtml}</div>`
    );

  if (!out.includes('rel="canonical"')) {
    out = out.replace(
      '</head>',
      `  <meta property="og:url" content="${safeUrl}" />\n    <link rel="canonical" href="${safeUrl}" />\n  </head>`
    );
  }
  return out;
}

app.get('/robots.txt', (req, res) => {
  const baseUrl = getRequestBaseUrl(req);
  res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const baseUrl = getRequestBaseUrl(req);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${baseUrl}/product</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/pricing</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
</urlset>`;
  res.type('application/xml').send(xml);
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  app.get(['/', '/product', '/pricing'], async (req, res, next) => {
    try {
      const indexPath = path.join(__dirname, 'index.html');
      const rawHtml = fs.readFileSync(indexPath, 'utf-8');
      const enriched = injectSeoIntoHtml(rawHtml, req);
      const transformed = await vite.transformIndexHtml(req.originalUrl, enriched);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(transformed);
    } catch (e) {
      next(e);
    }
  });

  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist"), { index: false }));
  app.get("*", (req, res) => {
    const distIndexPath = path.join(__dirname, "dist", "index.html");
    const rawHtml = fs.readFileSync(distIndexPath, 'utf-8');
    const enriched = injectSeoIntoHtml(rawHtml, req);
    res.status(200).set({ 'Content-Type': 'text/html' }).send(enriched);
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
