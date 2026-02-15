# Local testing with ngrok

Use ngrok to expose your local app over HTTPS so Google OAuth works without `redirect_uri_mismatch`.

## 1. Install ngrok

- **Option A:** [Download from ngrok.com](https://ngrok.com/download) and install.
- **Option B:** `npm install -g ngrok` (or use `npx ngrok` — no install).

## 2. Start the app and tunnel

**Terminal 1 — dev server (port 3000):**
```bash
npm run dev
```

**Terminal 2 — ngrok tunnel:**
```bash
npm run dev:tunnel
```
Or, if ngrok is installed globally:
```bash
ngrok http 3000
```

ngrok will print a **Forwarding** URL, e.g. `https://abc123.ngrok-free.app`.

## 3. Configure Google OAuth

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Edit your **OAuth 2.0 Client ID** (Web application).
3. **Authorized JavaScript origins:** add your ngrok URL (no trailing slash), e.g.  
   `https://abc123.ngrok-free.app`
4. **Authorized redirect URIs:** add the same URL, e.g.  
   `https://abc123.ngrok-free.app`
5. Save.

## 4. Use the app via ngrok

Open the ngrok URL in your browser (e.g. `https://abc123.ngrok-free.app`), go to Settings, paste your Spreadsheet ID and Google Client ID, then click **Sign in with Google**. The OAuth flow should complete without redirect errors.

**Note:** Free ngrok URLs change each time you restart the tunnel. If you get a new URL, add it again in Google Cloud Console (you can keep both the old and new ngrok URLs in the list).

---

## GitHub Pages (production)

After deploying to GitHub Pages (see workflow below), your app will be at:

`https://<username>.github.io/<repo-name>/`

Add that URL to Google Cloud Console **Authorized JavaScript origins** and **Authorized redirect URIs** (with trailing slash or without, depending on what the OAuth client sends — try both if needed).
