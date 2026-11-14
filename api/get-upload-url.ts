import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { fileName, fileType } = body || {};

    if (!fileName) {
      return res.status(400).json({ error: "fileName is required" });
    }

    let accountId = process.env.R2_ACCOUNT_ID;
    if (!accountId || accountId.startsWith("cfut_")) {
      accountId = "32143cfd2e67a3f632ebd77012172941";
    }
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "9921230f475bf0756a6d20f29a1b489b";
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "7e15a7eb5415f1ca7424ffad9135181cf1ce002a913732d3b31955b6b2f2cff6";
    let bucketName = process.env.R2_BUCKET_NAME || process.env.S3_BUCKET_NAME || "sendarro-uploads";
    if (bucketName === "R2 User Token") bucketName = "sendarro-uploads";

    const r2 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const sanitizedName = String(fileName).replace(/[^a-zA-Z0-9_.-]/g, "_");
    const fileKey = `clips/${Date.now()}-${Math.round(Math.random() * 1e9)}-${sanitizedName}`;
    const contentType = fileType || "application/octet-stream";

    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: contentType,
    });

    // 1-hour presigned upload URL to support large uploads up to 2GB
    const uploadUrl = await getSignedUrl(r2, putCommand, { expiresIn: 3600 });

    // Generate authenticated presigned download URL with attachment header (valid for 7 days)
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

    return res.status(200).json({
      directR2: true,
      uploadUrl,
      fileKey,
      publicUrl,
    });
  } catch (err: any) {
    console.error("Vercel get-upload-url error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate presigned upload URL" });
  }
}
