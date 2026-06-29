import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import os from "os";
import { createRequire } from 'module';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const require = createRequire(import.meta.url);
const firebaseConfig = require('./firebase-applet-config.json');

// Initialize Firebase Admin
try {
  initializeApp({
    credential: applicationDefault(),
    storageBucket: firebaseConfig.storageBucket,
  });
} catch (e) {
  console.error("Failed to initialize Firebase Admin, trying without credentials:", e);
  initializeApp({
    storageBucket: firebaseConfig.storageBucket,
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Use system temp directory for uploads
const uploadsDir = path.join(os.tmpdir(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Use a unique name to avoid collisions
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/upload", upload.array("files", 10), async (req, res) => {
  console.log("Upload request received");
  if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
    console.error("No files found in upload request");
    return res.status(400).json({ error: "No files uploaded" });
  }
  
  const bucket = getStorage().bucket();
  const fileInfos = [];
  
  for (const file of (req.files as Express.Multer.File[])) {
    console.log(`File processing: ${file.filename}, path: ${file.path}`);
    
    // Upload to Firebase Storage
    const fileName = `uploads/${file.filename}`;
    await bucket.upload(file.path, {
      destination: fileName,
      metadata: { contentType: file.mimetype },
    });
    
    // Create a signed URL valid for 60 seconds
    const [downloadUrl] = await bucket.file(fileName).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 1000,
    });
    
    // Delete temp file
    fs.unlinkSync(file.path);
    
    fileInfos.push({
      fileName: file.originalname,
      downloadUrl: downloadUrl
    });
  }

  res.json({ files: fileInfos });
});

// Removed /api/download/:fileId as we now use signed URLs

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
