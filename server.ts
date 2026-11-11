import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import path from "path";
import fs from "fs";
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

app.use(express.json());
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

      // Presigned URL valid for 15 minutes (900 seconds)
      const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 900 });

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
