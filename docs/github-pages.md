# Deploy to GitHub Pages

The repo includes a GitHub Actions workflow that builds the app as a static export and deploys it to GitHub Pages.

## 1. Enable GitHub Pages

1. In your repo: **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.

## 2. Push and deploy

Push to the `main` branch (or run the workflow manually from the **Actions** tab). The workflow will:

- Install dependencies and run `npm run build` with `NEXT_PUBLIC_BASE_PATH=/<repo-name>`
- Upload the `out/` folder and deploy it to GitHub Pages

Your app will be available at:

**https://\<username>.github.io/\<repo-name>/**

Example: if the repo is `humadi/halaqa_fateh`, the URL is `https://humadi.github.io/halaqa_fateh/`.

## 3. Google OAuth for production

In [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials), edit your OAuth 2.0 Client ID and add:

- **Authorized JavaScript origins:** `https://<username>.github.io`
- **Authorized redirect URIs:** `https://<username>.github.io/<repo-name>/` (or without trailing slash)

So both ngrok (local) and GitHub Pages (production) can be in the same OAuth client.

## 4. Local build (optional)

To build locally with the same basePath as GitHub Pages:

```bash
NEXT_PUBLIC_BASE_PATH=/halaqa_fateh npm run build
```

Then serve the `out/` folder with any static server. Without `NEXT_PUBLIC_BASE_PATH`, the app is built for the root path (e.g. local file or custom domain).
