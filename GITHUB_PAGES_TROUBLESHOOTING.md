# GitHub Pages Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: GitHub Pages Not Enabled

**Symptom**: Site shows 404 or "There isn't a GitHub Pages site here"

**Solution**:
1. Go to your repository: https://github.com/dicalvin/HIP-Chloera-Watch
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Source**, select: **GitHub Actions**
4. Click **Save**

**Important**: Do NOT select "Deploy from a branch" - use "GitHub Actions" instead.

### Issue 2: Workflow Not Running

**Symptom**: No deployment happening after pushing to main

**Solution**:
1. Go to **Actions** tab in your repository
2. Check if the "Deploy to GitHub Pages" workflow is running
3. If it's not running:
   - Check if GitHub Actions is enabled (Settings → Actions → General)
   - Make sure you're pushing to the `main` branch
   - Try manually triggering: Actions → Deploy to GitHub Pages → Run workflow

### Issue 3: Workflow Fails

**Symptom**: Workflow runs but fails with errors

**Common Causes**:
- **Build fails**: Check build logs in Actions tab
- **Permissions issue**: The workflow needs `pages: write` permission (already configured)
- **Path issues**: Make sure `cholera-dashboard/package.json` exists

**Solution**:
1. Go to **Actions** tab
2. Click on the failed workflow run
3. Check the error logs
4. Common fixes:
   - If `npm ci` fails: Check `package-lock.json` exists
   - If build fails: Check for syntax errors in code
   - If path fails: Verify `cholera-dashboard/dist` is created

### Issue 4: Assets Not Loading (404 on CSS/JS)

**Symptom**: Page loads but is blank or unstyled

**Cause**: Base path mismatch

**Solution**:
1. Check your repository name: `HIP-Chloera-Watch`
2. Verify the base path in workflow matches: `/HIP-Chloera-Watch/`
3. The workflow sets `VITE_BASE_PATH: /HIP-Chloera-Watch/` which should match
4. If your repository name is different, update line 41 in `.github/workflows/deploy.yml`

### Issue 5: Site Shows But API Doesn't Work

**Symptom**: Frontend loads but predictions don't work

**Cause**: API not deployed or CORS issues

**Solution**:
1. Deploy API separately (Railway/Render) - see `VERCEL_SIZE_LIMIT_SOLUTION.md`
2. Add environment variable to GitHub Actions workflow:
   - Edit `.github/workflows/deploy.yml`
   - Add to build step env:
     ```yaml
     VITE_LSTM_API_URL: https://your-api.railway.app
     ```
3. Or update `cholera-dashboard/src/hooks/useLSTMPredictions.js` directly

## Step-by-Step Setup

### 1. Enable GitHub Pages

1. Repository → **Settings** → **Pages**
2. **Source**: Select **GitHub Actions**
3. **Save**

### 2. Verify Workflow File

The workflow file should be at:
`.github/workflows/deploy.yml`

It should:
- Trigger on push to `main`
- Build from `cholera-dashboard/` directory
- Set base path to `/HIP-Chloera-Watch/`
- Deploy to GitHub Pages

### 3. Check Repository Name

Your repository name is: `HIP-Chloera-Watch`

The base path in the workflow is: `/HIP-Chloera-Watch/`

These should match. If your repository name is different, update:
- Line 41 in `.github/workflows/deploy.yml`: `VITE_BASE_PATH: /YOUR-REPO-NAME/`

### 4. Trigger Deployment

**Option A: Automatic**
- Push any commit to `main` branch
- Workflow will run automatically

**Option B: Manual**
- Go to **Actions** tab
- Select "Deploy to GitHub Pages" workflow
- Click "Run workflow" → "Run workflow"

### 5. Verify Deployment

1. Wait for workflow to complete (check Actions tab)
2. Go to **Settings** → **Pages**
3. You should see: "Your site is live at https://dicalvin.github.io/HIP-Chloera-Watch/"
4. Visit the URL to verify

## Verification Checklist

- [ ] GitHub Pages enabled (Settings → Pages → Source: GitHub Actions)
- [ ] Workflow file exists (`.github/workflows/deploy.yml`)
- [ ] Repository name matches base path (`HIP-Chloera-Watch`)
- [ ] Workflow runs successfully (check Actions tab)
- [ ] Site is accessible at `https://dicalvin.github.io/HIP-Chloera-Watch/`
- [ ] Assets load correctly (check browser console for 404s)

## Still Not Working?

1. **Check Actions Logs**:
   - Go to Actions tab
   - Click on the latest workflow run
   - Review all steps for errors

2. **Check Browser Console**:
   - Open your site
   - Press F12 → Console tab
   - Look for errors (404s, CORS, etc.)

3. **Verify File Structure**:
   - Make sure `cholera-dashboard/package.json` exists
   - Make sure `cholera-dashboard/src/` exists
   - Make sure workflow path is correct

4. **Test Locally**:
   ```bash
   cd cholera-dashboard
   npm install
   npm run build
   # Check if dist/ folder is created
   ```

## Quick Fix Commands

If you need to manually trigger or fix:

```bash
# Make sure you're on main branch
git checkout main

# Make a small change to trigger workflow
echo "# Trigger" >> README.md
git add README.md
git commit -m "Trigger GitHub Pages deployment"
git push origin main
```

