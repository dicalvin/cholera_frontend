# URGENT: Fix GitHub Pages Showing README

## The Problem

GitHub Pages is showing README.md instead of your React app. This happens when:
1. GitHub Pages Source is set to "Deploy from a branch" (shows README)
2. OR the GitHub Actions workflow hasn't run/failed

## IMMEDIATE FIX - Do These Steps:

### Step 1: Check GitHub Pages Source (CRITICAL)

1. Go to: **https://github.com/dicalvin/HIP-Chloera-Watch/settings/pages**
2. Look at the **"Source"** dropdown
3. **IT MUST SAY "GitHub Actions"** - NOT "Deploy from a branch"
4. If it says "Deploy from a branch":
   - Click the dropdown
   - Select **"GitHub Actions"**
   - Click **Save**
   - This is the #1 reason it shows README!

### Step 2: Check Workflow Status

1. Go to: **https://github.com/dicalvin/HIP-Chloera-Watch/actions**
2. Do you see "Deploy to GitHub Pages" workflow?
3. Has it run? (Check for green checkmarks or red X's)
4. If it hasn't run or failed:
   - Click "Deploy to GitHub Pages"
   - Click **"Run workflow"** button (top right)
   - Select branch: **main**
   - Click **"Run workflow"**

### Step 3: Wait for Deployment

1. Watch the workflow run (refresh Actions page)
2. Wait for BOTH jobs to complete:
   - ✅ **build** (builds React app)
   - ✅ **deploy** (deploys to GitHub Pages)
3. This takes 2-5 minutes

### Step 4: Verify

1. Go to: **https://github.com/dicalvin/HIP-Chloera-Watch/settings/pages**
2. You should see: "Your site is live at https://dicalvin.github.io/HIP-Chloera-Watch/"
3. There should be a green checkmark with recent deployment time
4. Visit the site and do **HARD REFRESH**: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)

## If Still Not Working:

### Check Workflow Errors

1. Go to Actions tab
2. Click on the latest workflow run
3. Click on the **build** job
4. Look for red X's or error messages
5. Common errors:
   - "npm ci failed" → Check if package-lock.json exists
   - "Build failed" → Check for code errors
   - "Path not found" → Verify cholera-dashboard folder structure

### Alternative: Manual Deployment

If workflow keeps failing, deploy manually:

```bash
cd cholera-dashboard
npm install
npm run build
npx gh-pages -d dist
```

Then in Settings → Pages:
- Source: **Deploy from a branch**
- Branch: **gh-pages**
- Folder: **/ (root)**

## Most Common Issue

**90% of the time, the issue is Step 1**: GitHub Pages Source is set to "Deploy from a branch" instead of "GitHub Actions".

**Check this first!** Go to Settings → Pages and verify it says "GitHub Actions".

