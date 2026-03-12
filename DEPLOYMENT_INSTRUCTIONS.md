# Deployment Instructions

## Current Status

Your changes are staged and ready to commit. However, there's a **disk space issue** that needs to be resolved first.

## Step 1: Free Up Disk Space

You need to free up disk space before committing. Here are some options:

1. **Clear npm cache:**
   ```powershell
   npm cache clean --force
   ```

2. **Delete node_modules and reinstall (if needed):**
   ```powershell
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

3. **Clear temporary files:**
   ```powershell
   Remove-Item -Recurse -Force $env:TEMP\*
   ```

4. **Check disk space:**
   ```powershell
   Get-PSDrive C | Select-Object Used,Free
   ```

## Step 2: Complete Git Commit

Once you have space, run:

```powershell
git commit -m "Add ML forecasting with Voting Ensemble model, fix prediction feedback loops, improve UI and responsive design"
```

## Step 3: Push to GitHub

```powershell
git push origin main
```

## Step 4: Install gh-pages (if not already installed)

```powershell
npm install --save-dev gh-pages
```

## Step 5: Deploy to GitHub Pages

```powershell
npm run deploy
```

This will:
1. Build the production version
2. Deploy to the `gh-pages` branch
3. Make your site available at: `https://dicalvin.github.io/Cholera-Watch/`

## Step 6: Deploy Flask API Separately

**Important**: GitHub Pages only serves static files, so the Flask API must be deployed separately.

### Quick Option: Render.com (Free)

1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `dicalvin/Cholera-Watch`
4. Configure:
   - **Name**: `cholera-api` (or any name)
   - **Root Directory**: `api`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python predict.py`
5. Add environment variable (if needed):
   - `PORT`: `5000` (Render will set this automatically)
6. Click "Create Web Service"
7. Wait for deployment (takes 2-5 minutes)

### After API Deployment

1. Get your API URL from Render (e.g., `https://cholera-api.onrender.com`)
2. Update the frontend to use the production API:
   - Create `.env.production` file:
     ```
     VITE_API_URL=https://your-api-url.onrender.com/api/predict
     ```
   - Or update `src/pages/EarlyWarning.jsx` line 14:
     ```javascript
     const API_URL = 'https://your-api-url.onrender.com/api/predict'
     ```
3. Rebuild and redeploy:
   ```powershell
   npm run build
   npm run deploy
   ```

## Alternative: Railway.app

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project → Deploy from GitHub repo
4. Select your repository
5. Add service → Select `api/` folder
6. Railway auto-detects Python and deploys

## Testing

After deployment:

1. **Test GitHub Pages**: Visit `https://dicalvin.github.io/Cholera-Watch/`
2. **Test API**: Visit `https://your-api-url.com/health`
3. **Check predictions**: The Early Warning page should show forecasts

## Troubleshooting

### API not working on GitHub Pages
- This is expected! GitHub Pages is static-only
- Deploy the API separately (see Step 6)

### CORS errors
- Make sure Flask-CORS is installed: `pip install flask-cors`
- Check that `CORS(app)` is in `predict.py`

### Model file not found
- Upload model files to your API deployment platform
- Update `MODEL_PATH` in `predict.py` if needed

### Predictions showing 0
- Check browser console for errors
- Verify API is running and accessible
- Check API logs for errors

## Files Changed

- ✅ Added Voting Ensemble model support
- ✅ Fixed prediction feedback loops
- ✅ Improved UI with responsive design
- ✅ Added hamburger menu for mobile
- ✅ Enhanced scatterplot and map visualizations
- ✅ Added new analysis pages (Response Insights, Resource Planning)
- ✅ Integrated ML forecasting into Early Warning page
- ✅ Updated all date ranges to 2011-2024

