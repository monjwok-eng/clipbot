import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const keyParam = req.query?.key || req.query?.fileKey || req.body?.key || req.body?.fileKey;
    const nameParam = req.query?.fileName || req.query?.filename || req.body?.fileName || req.body?.filename;
    const urlParam = req.query?.url || req.body?.url;

    let fileKey = keyParam;
    if (!fileKey && urlParam) {
      // Extract fileKey from URL if given
      const match = urlParam.match(/clips\/[^?]+/);
      if (match) fileKey = match[0];
    }

    if (!fileKey) {
      return res.status(400).json({ error: "fileKey or url is required" });
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

    const fileName = nameParam || fileKey.split('/').pop() || 'download';
    const sanitizedName = String(fileName).replace(/[^a-zA-Z0-9_.-]/g, "_");

    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(sanitizedName)}"`,
    });

    const downloadUrl = await getSignedUrl(r2, getCommand, { expiresIn: 604800 });

    // If request was a direct GET with redirect parameter, redirect straight to file
    if (req.method === "GET" && req.query?.redirect === "true") {
      return res.redirect(downloadUrl);
    }

    return res.status(200).json({
      downloadUrl,
      fileKey,
      fileName: sanitizedName,
    });
  } catch (err: any) {
    console.error("Vercel get-download-url error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate download URL" });
  }
}
