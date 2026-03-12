# Vercel Deployment - Complete Guide

## Quick Start

Since you've deployed to Vercel before, here's the updated setup:

## Step 1: Deploy Frontend to Vercel

### Via Dashboard (Easiest)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. If project exists: Click on it → "Deployments" → "Redeploy"
3. If new project: "Add New..." → "Project" → Import `dicalvin/Cholera-Watch`
4. Configure:
   - **Framework**: Vite (auto-detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click "Deploy"

### Via CLI

```bash
# Install Vercel CLI (if needed)
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Production deployment
vercel --prod
```

## Step 2: Deploy API Separately (Recommended)

**Why separate?** Vercel serverless functions have size limits (~50MB), and model files are large.

### Option A: Render.com (Free, Recommended)

1. Go to [render.com](https://render.com) → Sign up
2. "New +" → "Web Service"
3. Connect GitHub: `dicalvin/Cholera-Watch`
4. Configure:
   - **Name**: `cholera-api`
   - **Root Directory**: `api`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python predict.py`
5. **Important**: Upload model files
   - Go to "Environment" tab
   - Or use Render's file upload feature
   - Or connect via SSH and upload
6. Deploy → Get your URL: `https://cholera-api.onrender.com`

### Option B: Railway.app

1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. "New Project" → "Deploy from GitHub repo"
3. Select `dicalvin/Cholera-Watch`
4. Add service → Select `api/` folder
5. Railway auto-detects Python
6. Upload model files via Railway dashboard
7. Deploy → Get your URL

## Step 3: Connect Frontend to API

1. **Get your API URL** (from Render/Railway)
   - Example: `https://cholera-api.onrender.com`

2. **Add Environment Variable in Vercel**
   - Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add:
     - **Name**: `VITE_API_URL`
     - **Value**: `https://cholera-api.onrender.com/api/predict`
     - **Environment**: Production (and Preview if you want)

3. **Redeploy Frontend**
   - Vercel Dashboard → Deployments → Click "..." → "Redeploy"
   - Or push a new commit to trigger auto-deploy

## Step 4: Update Code (Already Done)

The code is already configured to:
- ✅ Use environment variable `VITE_API_URL` if set
- ✅ Fall back to localhost for development
- ✅ Auto-detect Vercel deployment

## Testing

1. **Frontend**: Visit your Vercel URL
2. **API Health**: `https://your-api-url.com/health`
3. **Predictions**: Go to Early Warning page → Should show forecasts

## Model Files Upload

Since `.pkl` files are in `.gitignore` (too large for Git):

### For Render:
1. Use Render's file upload in dashboard
2. Or connect via SSH: `ssh your-app@ssh.render.com`
3. Upload to: `/opt/render/project/src/api/` (or check Render docs)

### For Railway:
1. Use Railway's file upload feature
2. Or connect via Railway CLI and upload

### Alternative: Use Cloud Storage
1. Upload models to AWS S3 / Google Cloud Storage
2. Download in deployment script using API keys
3. Update `MODEL_PATH` in code

## Continuous Deployment

Both Vercel and Render/Railway auto-deploy on Git push:
- Push to `main` → Both services detect → Auto-deploy → Live in 2-5 minutes

## Troubleshooting

### API returns 404
- Check API is deployed and running
- Verify API URL in Vercel environment variables
- Check API logs in Render/Railway dashboard

### CORS errors
- Ensure `flask-cors` is installed: `pip install flask-cors`
- Check `CORS(app)` is in `predict.py`
- Verify API URL is correct

### Predictions are 0
- Check browser console (F12) for errors
- Verify API is accessible: `curl https://your-api-url.com/health`
- Check API logs for model loading errors

### Model not found
- Upload model files to deployment platform
- Check `MODEL_PATH` in `predict.py` points to correct location
- Verify file permissions

## Current Configuration

✅ **Frontend**: Ready for Vercel
✅ **API**: Ready for Render/Railway
✅ **Environment Variables**: Configured
✅ **CORS**: Enabled
✅ **Auto-detection**: Vercel vs localhost

## Next Steps

1. Free up disk space (if needed)
2. Commit and push changes:
   ```bash
   git commit -m "Add ML forecasting, fix predictions, prepare for Vercel deployment"
   git push origin main
   ```
3. Deploy frontend to Vercel (via dashboard or CLI)
4. Deploy API to Render/Railway
5. Add `VITE_API_URL` environment variable in Vercel
6. Test and verify!

