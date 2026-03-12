# Vercel Quick Start Guide

## Prerequisites

Before deploying to Vercel, ensure these files are in the **repository root** (same level as `cholera-dashboard/`):
- `random_forest_model.pkl`
- `cholera_data3.csv`

## Deployment Steps

### Method 1: Vercel Dashboard (Easiest)

1. **Go to Vercel**: https://vercel.com
2. **Sign in** with your GitHub account
3. **Click "New Project"**
4. **Import Repository**: Select `dicalvin/HIP-Chloera-Watch`
5. **Configure Project**:
   - **Root Directory**: `cholera-dashboard` (IMPORTANT!)
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
6. **Environment Variables**: Leave empty (or set `VITE_LSTM_API_URL` if needed)
7. **Click "Deploy"**

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to project
cd cholera-dashboard

# Login to Vercel
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

## Important Notes

### File Locations

The API functions look for:
- `random_forest_model.pkl` 
- `cholera_data3.csv`

These should be in the **repository root** (not in `cholera-dashboard/`). The API will automatically search multiple paths to find them.

### Root Directory Setting

When deploying from Vercel dashboard, **set Root Directory to `cholera-dashboard`**. This tells Vercel where your project files are located.

### API Endpoints

After deployment, your API will be available at:
- `https://your-project.vercel.app/api/health`
- `https://your-project.vercel.app/api/lstm/predict`
- `https://your-project.vercel.app/api/lstm/forecast`

The frontend will automatically use these endpoints (relative paths).

## Troubleshooting

### "Model not found" errors
- Verify `random_forest_model.pkl` is in the repository root
- Check Vercel function logs in the dashboard
- The API searches multiple paths automatically

### "Dataset not found" errors
- Verify `cholera_data3.csv` is in the repository root
- Check file size (Vercel has limits)
- Review function logs

### Build fails
- Check that `package.json` exists in `cholera-dashboard/`
- Verify all dependencies are listed
- Review build logs in Vercel dashboard

### API returns 500 errors
- Check Vercel function logs (most important!)
- Verify Python dependencies in `api/requirements.txt`
- Check that model and dataset files are accessible

## Automatic Deployments

Once connected to GitHub:
- **Every push to `main`** → Production deployment
- **Pull requests** → Preview deployments

## Next Steps

After successful deployment:
1. Test the API: Visit `https://your-project.vercel.app/api/health`
2. Test the frontend: Visit `https://your-project.vercel.app`
3. Check function logs if anything doesn't work

## Support

- Vercel Documentation: https://vercel.com/docs
- Function Logs: Vercel Dashboard → Your Project → Functions → Logs
- Build Logs: Vercel Dashboard → Your Project → Deployments → View Logs
