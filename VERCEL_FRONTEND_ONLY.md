# Vercel Frontend-Only Deployment Guide

## Current Configuration

Your `vercel.json` is already configured for frontend-only deployment. It will:
- Build the React app using `npm run build`
- Serve static files from the `dist` directory
- Route all requests to `index.html` for client-side routing

## Vercel Project Settings

### Step 1: Verify Project Settings

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your project: `HIP-Chloera-Watch`
3. Go to **Settings** → **General**

### Step 2: Configure Root Directory

**IMPORTANT**: Set the Root Directory to `cholera-dashboard`

1. Scroll down to **Root Directory**
2. Click **Edit**
3. Enter: `cholera-dashboard`
4. Click **Save**

This tells Vercel where your project files are located.

### Step 3: Verify Build Settings

In **Settings** → **General**, verify:

- **Framework Preset**: `Vite` (auto-detected)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

These should be auto-detected correctly. If not, set them manually.

### Step 4: Environment Variables (Optional - for API connection)

If you've deployed your API separately (Railway/Render), add the API URL:

1. Go to **Settings** → **Environment Variables**
2. Click **Add New**
3. Add:
   - **Key**: `VITE_LSTM_API_URL`
   - **Value**: `https://your-api.railway.app` (your actual API URL)
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**

### Step 5: Deploy

1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment, OR
3. Push a new commit to trigger automatic deployment

## What Gets Deployed

With the current configuration, Vercel will:

✅ **Include:**
- React frontend code (`src/`)
- Static assets (`public/`)
- Build output (`dist/`)
- Configuration files (`package.json`, `vite.config.js`, `vercel.json`)

❌ **Exclude:**
- Python API files (`api/` folder)
- Node modules (installed during build)
- Git files
- Documentation files (via `.vercelignore`)

## Verification

After deployment:

1. Visit your site: `https://hip-chloera-watch.vercel.app`
2. Check the browser console for any errors
3. The frontend should load, but API calls will fail until you:
   - Deploy the API separately (Railway/Render)
   - Add the `VITE_LSTM_API_URL` environment variable

## Troubleshooting

### Build Fails
- Check that Root Directory is set to `cholera-dashboard`
- Verify `package.json` exists in `cholera-dashboard/`
- Check build logs in Vercel dashboard

### Site Shows 404
- Verify `vercel.json` has the rewrite rule: `"source": "/(.*)", "destination": "/index.html"`
- Check that `dist/index.html` is being generated

### API Calls Fail
- This is expected until you deploy the API separately
- Add `VITE_LSTM_API_URL` environment variable once API is deployed
- Check browser console for CORS errors

## Current Status

Your `vercel.json` is correctly configured for frontend-only deployment. Just make sure:
1. ✅ Root Directory is set to `cholera-dashboard` in Vercel settings
2. ✅ Build settings are correct (auto-detected)
3. ✅ Deploy and verify the frontend loads

The API functions have been removed from `vercel.json`, so Vercel will only deploy the frontend.

