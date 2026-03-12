# Complete GitHub Pages Setup Guide

## Step-by-Step Instructions

### Step 1: Enable GitHub Pages

1. Go to: **https://github.com/dicalvin/HIP-Cholera-Watch/settings/pages**
2. Scroll to the **"Source"** section at the top
3. Click the dropdown and select: **"GitHub Actions"**
4. Click **Save**

**⚠️ CRITICAL**: Must select **"GitHub Actions"** (NOT "Deploy from a branch")

### Step 2: Verify/Create Workflow File

The workflow file should exist at: `.github/workflows/deploy.yml`

**If it doesn't exist**, create it:

1. Go to: **https://github.com/dicalvin/HIP-Cholera-Watch**
2. Click **"Add file"** → **"Create new file"**
3. Enter path: `.github/workflows/deploy.yml`
4. Copy and paste this content:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: cholera-dashboard/package-lock.json

      - name: Install dependencies
        working-directory: ./cholera-dashboard
        run: npm ci

      - name: Build
        working-directory: ./cholera-dashboard
        run: npm run build
        env:
          NODE_ENV: production
          VITE_BASE_PATH: /HIP-Cholera-Watch/

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './cholera-dashboard/dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

5. Click **"Commit new file"** (green button at bottom)

### Step 3: Trigger the Workflow

**Option A: Manual Trigger (Recommended for First Time)**

1. Go to: **https://github.com/dicalvin/HIP-Cholera-Watch/actions**
2. Click **"Deploy to GitHub Pages"** in the left sidebar
3. If you don't see it, wait a moment and refresh the page
4. Click the blue **"Run workflow"** button (top right)
5. Select branch: **main**
6. Click the green **"Run workflow"** button

**Option B: Automatic Trigger**

The workflow will automatically run when you push to `main` branch. You can trigger it by:

```bash
git commit --allow-empty -m "Trigger GitHub Pages deployment"
git push origin main
```

### Step 4: Monitor the Deployment

1. Stay on the **Actions** tab
2. Click on the running workflow to see progress
3. You'll see two jobs:
   - **build** - Builds your React app (takes 2-3 minutes)
   - **deploy** - Deploys to GitHub Pages (takes 1-2 minutes)
4. Wait for both to show green checkmarks ✅

### Step 5: Verify Deployment

1. Go to: **https://github.com/dicalvin/HIP-Cholera-Watch/settings/pages**
2. You should see: **"Your site is live at https://dicalvin.github.io/HIP-Cholera-Watch/"**
3. There should be a green checkmark with deployment time
4. Visit: **https://dicalvin.github.io/HIP-Cholera-Watch/**
5. Do a **hard refresh**: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)

## What the Workflow Does

1. ✅ **Checkout**: Gets your code from the `main` branch
2. ✅ **Setup Node.js**: Installs Node.js 18
3. ✅ **Install dependencies**: Runs `npm ci` in `cholera-dashboard/` folder
4. ✅ **Build**: Runs `npm run build` to create the production build
5. ✅ **Setup Pages**: Prepares GitHub Pages
6. ✅ **Upload artifact**: Uploads the `dist/` folder
7. ✅ **Deploy**: Deploys to GitHub Pages

## Troubleshooting

### Workflow Doesn't Appear

1. Make sure the file exists: `.github/workflows/deploy.yml`
2. Check that GitHub Actions is enabled: Settings → Actions → General
3. Refresh the Actions page

### Workflow Fails

**Check the error in Actions tab:**

- **"npm ci failed"**:
  - Make sure `cholera-dashboard/package-lock.json` exists
  - If not, run `npm install` locally and commit `package-lock.json`

- **"Build failed"**:
  - Check for syntax errors in your code
  - Review the build logs in Actions tab

- **"Path not found"**:
  - Verify `cholera-dashboard/` folder exists
  - Verify `cholera-dashboard/package.json` exists

### Site Shows README

1. **Double-check** Settings → Pages → Source is **"GitHub Actions"**
2. **Verify** workflow completed successfully (green checkmarks)
3. **Wait 5-10 minutes** - GitHub Pages can take time to update
4. **Clear browser cache** or use incognito mode

### Assets Don't Load (404 on CSS/JS)

The base path is set to `/HIP-Cholera-Watch/` which matches your repository name. If assets don't load:

1. Check browser console (F12) for 404 errors
2. Verify repository name is exactly `HIP-Cholera-Watch`
3. If different, update `VITE_BASE_PATH` in the workflow file

## Quick Checklist

- [ ] GitHub Pages enabled (Settings → Pages → Source: **GitHub Actions**)
- [ ] Workflow file exists (`.github/workflows/deploy.yml`)
- [ ] Workflow triggered (Actions tab shows running/completed workflow)
- [ ] Both jobs completed (build ✅ and deploy ✅)
- [ ] Site accessible at https://dicalvin.github.io/HIP-Cholera-Watch/
- [ ] React dashboard shows (not README)

## Expected Result

After successful deployment:
- ✅ Site accessible at **https://dicalvin.github.io/HIP-Cholera-Watch/**
- ✅ React dashboard loads (navigation menu, charts, maps)
- ✅ NOT showing README.md content
- ✅ All assets (CSS, JS, images) load correctly
- ✅ Interactive features work

## Next Steps

Once the frontend is working:
1. **Deploy API separately** (Railway/Render) - see `VERCEL_SIZE_LIMIT_SOLUTION.md`
2. **Add API URL** to workflow environment variables
3. **Redeploy** to connect frontend to API

