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

app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", storage: "server-hosted" });
});

app.get("/api/time", (req, res) => {
  res.json({ time: Date.now() });
});

app.post("/api/create-checkout-session", verifyToken, async (req, res) => {
  try {
    const { priceId } = req.body;
    const user = (req as any).user;
    if (!priceId) {
      return res.status(400).json({ error: "Invalid price ID" });
    }
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const successUrl = `${protocol}://${host}/?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${protocol}://${host}/?payment=cancel`;

    const session = await getStripe().checkout.sessions.create({
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

    // Determine tier from price ID
    let tier = 'pro';
    const lineItems = session.line_items?.data || [];
    for (const item of lineItems) {
      const priceId = typeof item.price === 'string' ? item.price : item.price?.id;
      if (priceId === 'price_1UTLRhFslIabHAR8lfuTN4fl') {
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
    const targetUid = authUser.uid;

    const sessions = await getStripe().checkout.sessions.list({ limit: 10 });
    const userSession = sessions.data.find(s => 
      s.client_reference_id === targetUid || 
      (authUser.email && s.customer_email === authUser.email)
    );

    if (!userSession || (userSession.payment_status !== 'paid' && userSession.status !== 'complete')) {
      return res.json({ synced: false, message: "No active paid session found" });
    }

    const fullSession = await getStripe().checkout.sessions.retrieve(userSession.id, {
      expand: ['line_items']
    });

    let tier = 'pro';
    const lineItems = fullSession.line_items?.data || [];
    for (const item of lineItems) {
      const priceId = typeof item.price === 'string' ? item.price : item.price?.id;
      if (priceId === 'price_1UTLRhFslIabHAR8lfuTN4fl') {
        tier = 'promax';
        break;
      }
    }

    const customerId = typeof fullSession.customer === 'string' ? fullSession.customer : fullSession.customer?.id;

    const dbAdmin = getFirestore();
    const userRef = dbAdmin.collection('users').doc(targetUid);
    await userRef.set({
      tier: tier,
      stripeCustomerId: customerId || null,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    res.json({ synced: true, tier, customerId });
  } catch (err: any) {
    console.error("Sync Subscription Error:", err);
    res.status(500).json({ error: err.message });
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
