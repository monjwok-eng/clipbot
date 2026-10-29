# File Upload Migration Plan: Local Server to Firebase Storage

## Overview
Currently, files are uploaded to the local temporary storage of the Node.js server (`server.ts`), which causes latency and bottlenecking. We will migrate to **Firebase Storage** so that files are uploaded directly from the user's browser, bypassing the server to maximize speed.

## Proposed Changes
1.  **Frontend (App.tsx)**:
    - Replace the fetch to `/api/upload` with direct `uploadBytes` and `getDownloadURL` calls to `firebase/storage`.
    - Generate unique file paths in Firebase Storage: `clips/${code}/${fileName}`.
    - Pass the resulting download URLs back to the Firestore `setDoc` operation for the clip.
2.  **Backend (server.ts)**:
    - Remove the `/api/upload` endpoint and the multer-based storage handling.
3.  **Firebase Infrastructure**:
    - Ensure `firebase-applet-config.json` includes the Storage bucket URL.
    - Set up Storage security rules to allow read/write for authenticated/authorized users.

## Risk Assessment
- High impact on `handleShare` logic in `App.tsx`.
- Requires careful handling of file metadata to ensure existing download links remain functional during the transition.
- **Security**: Must enforce robust rules in `storage.rules`.
