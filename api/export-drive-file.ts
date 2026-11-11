export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Expose-Headers", "X-File-Name, X-File-Type, Content-Disposition");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { fileId, accessToken, mimeType, fileName } = body || {};

    if (!fileId || !accessToken) {
      return res.status(400).json({ error: "fileId and accessToken are required" });
    }

    // Determine whether this is a Google Docs / Sheets / Slides workspace document
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
      // Regular binary file stored on Drive (PDF, ZIP, image, etc.)
      targetUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      targetMime = mimeType || "application/octet-stream";
    }

    // Fetch from Google Drive API with automatic redirect following
    let gRes = await fetch(targetUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      redirect: "follow",
    });

    // If docx/xlsx/pptx export fails or is restricted, fallback to universal PDF export for Google Docs
    if (!gRes.ok && isGoogleDoc && targetMime !== "application/pdf") {
      targetMime = "application/pdf";
      targetExt = ".pdf";
      targetUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`;
      gRes = await fetch(targetUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
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

    // Validate that Google did not send an HTML login page or JSON error string
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
}
