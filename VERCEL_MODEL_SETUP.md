# Vercel Model Setup Guide

## Problem: Out of Memory During Build

Vercel builds can fail with "out of memory" errors if model files (`.pkl`) are included in the build process. Model files are large and should not be loaded during the build phase.

## Solution: Lazy Model Loading

The API has been updated to use **lazy loading** - models are only loaded when a prediction is requested, not during the build.

## How to Deploy Models to Vercel

### Option 1: Upload Models via Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Upload model files as environment variables or use Vercel's file storage

### Option 2: Use Vercel CLI to Upload Models

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link your project
vercel link

# Upload model files to Vercel's storage
# Note: This requires Vercel Pro plan or use external storage
```

### Option 3: Use External Storage (Best for Large Models)

Store models in:
- **AWS S3** (recommended)
- **Google Cloud Storage**
- **Azure Blob Storage**
- **Cloudinary**

Then update `api/predict.py` to download models from storage on first use.

### Option 4: Use Vercel Environment Variables for Model Path

1. Store your model in a cloud storage service
2. Set environment variable in Vercel:
   - `CUSTOM_MODEL_PATH` = URL to your model file
3. Update `api/predict.py` to download from URL if needed

## Current Configuration

- ✅ Models are excluded from build (`.vercelignore`)
- ✅ Lazy loading implemented (models load on first API call)
- ✅ Function memory set to 3008MB in `vercel.json`
- ✅ Build command optimized to skip model files

## Testing Locally

```bash
# Start the API (without model files)
cd api
python predict.py

# The API will show a warning if models are missing
# This is expected - models should be uploaded separately
```

## After Deployment

1. Check the `/api/health` endpoint to verify model loading
2. If models are missing, you'll see: `"model_loaded": false`
3. Upload models using one of the options above
4. Models will be cached after first load (Vercel serverless functions cache)

## Memory Limits

- **Free/Hobby**: 1024MB per function
- **Pro**: 3008MB per function (configured in `vercel.json`)
- **Enterprise**: Custom limits

If you need more memory, consider:
- Using Vercel Pro plan
- Splitting models into smaller files
- Using model quantization
- Deploying API separately (Render.com, Railway, etc.)

