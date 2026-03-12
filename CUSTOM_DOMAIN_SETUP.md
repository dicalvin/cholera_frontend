# Custom Domain Setup for GitHub Pages

## Your Custom Domain
**Domain**: `cholerawatch.com`

## Step-by-Step Setup

### Step 1: Configure Domain in GitHub Pages

1. Go to: **https://github.com/dicalvin/HIP-Cholera-Watch/settings/pages**
2. Scroll to **"Custom domain"** section
3. Enter your domain: **cholerawatch.com**
4. Click **Save**
5. GitHub will create/update the `CNAME` file automatically

**Important**: 
- Don't include `http://` or `https://` - just the domain name
- You can use `www.cholerawatch.com` or `cholerawatch.com` (or both)

### Step 2: Configure DNS Records

You need to add DNS records at your domain registrar (where you bought the domain). Add these records:

#### Option A: Apex Domain (cholerawatch.com)

Add **4 A records** pointing to GitHub Pages IPs:

```
Type: A
Name: @ (or leave blank)
Value: 185.199.108.153
TTL: 3600 (or default)

Type: A
Name: @ (or leave blank)
Value: 185.199.109.153
TTL: 3600 (or default)

Type: A
Name: @ (or leave blank)
Value: 185.199.110.153
TTL: 3600 (or default)

Type: A
Name: @ (or leave blank)
Value: 185.199.111.153
TTL: 3600 (or default)
```

#### Option B: WWW Subdomain (www.cholerawatch.com)

Add **1 CNAME record**:

```
Type: CNAME
Name: www
Value: dicalvin.github.io
TTL: 3600 (or default)
```

#### Option C: Both (Recommended)

Add both:
- 4 A records for `cholerawatch.com` (apex domain)
- 1 CNAME record for `www.cholerawatch.com`

### Step 3: Enable HTTPS (Automatic)

1. After DNS records are set, go back to Settings → Pages
2. Check **"Enforce HTTPS"** checkbox
3. This enables SSL certificate (free from GitHub)
4. Wait 24-48 hours for DNS to propagate and HTTPS to activate

### Step 4: Update Base Path (If Needed)

If you're using the custom domain, you might want to update the base path:

**For custom domain**: Use `/` (root path)
**For GitHub Pages subdomain**: Use `/HIP-Cholera-Watch/`

Since you have a custom domain, you can update the workflow to use root path:

Edit `.github/workflows/deploy.yml`:
```yaml
env:
  NODE_ENV: production
  VITE_BASE_PATH: /  # Use root for custom domain
```

Or keep it as is - it will work with both URLs.

### Step 5: Wait for DNS Propagation

- DNS changes can take **24-48 hours** to propagate globally
- You can check DNS propagation: https://www.whatsmydns.net/
- Enter your domain and check if it points to GitHub IPs

## Verification Steps

### Check DNS Records

1. Go to: https://www.whatsmydns.net/
2. Enter: `cholerawatch.com`
3. Select: **A** record type
4. Check if it shows GitHub Pages IPs: `185.199.108.153`, `185.199.109.153`, etc.

### Check GitHub Pages Settings

1. Go to: Settings → Pages
2. Under "Custom domain", you should see: `cholerawatch.com`
3. There should be a green checkmark if DNS is configured correctly
4. If there's a warning, click "Remove" and re-add the domain

### Test the Site

1. Visit: **https://cholerawatch.com** (or http:// if HTTPS not ready)
2. The site should load (might take a few minutes after DNS update)
3. If you see the error, DNS hasn't propagated yet - wait and try again

## Troubleshooting

### "DNS_PROBE_FINISHED_NXDOMAIN" Error

This means DNS records aren't set up correctly:

1. **Check DNS records** at your domain registrar
2. **Verify A records** point to GitHub IPs (if using apex domain)
3. **Verify CNAME** points to `dicalvin.github.io` (if using www)
4. **Wait 24-48 hours** for DNS propagation

### Site Shows GitHub 404

1. Make sure GitHub Pages is enabled (Settings → Pages → Source: GitHub Actions)
2. Make sure the workflow has run successfully
3. Check that `CNAME` file exists in repository root

### HTTPS Not Working

1. Wait 24-48 hours after adding domain
2. Make sure DNS records are correct
3. Check "Enforce HTTPS" in Settings → Pages
4. GitHub automatically provisions SSL certificate

### Mixed Content Warnings

If you see mixed content warnings:
1. Make sure all assets use HTTPS
2. Check that base path is correct
3. Clear browser cache

## Common Domain Registrars Setup

### GoDaddy
1. Login → My Products → DNS
2. Add A records (4 records with GitHub IPs)
3. Add CNAME for www

### Namecheap
1. Login → Domain List → Manage → Advanced DNS
2. Add A records (4 records with GitHub IPs)
3. Add CNAME for www

### Cloudflare
1. Login → Select domain → DNS
2. Add A records (4 records with GitHub IPs)
3. Add CNAME for www
4. **Important**: Set SSL/TLS to "Full" mode

### Google Domains
1. Login → DNS → Custom resource records
2. Add A records (4 records with GitHub IPs)
3. Add CNAME for www

## Quick Checklist

- [ ] Domain added in GitHub Settings → Pages → Custom domain
- [ ] DNS A records added (4 records for apex domain)
- [ ] DNS CNAME record added (for www subdomain, optional)
- [ ] CNAME file exists in repository (GitHub creates this automatically)
- [ ] Wait 24-48 hours for DNS propagation
- [ ] HTTPS enabled in GitHub Settings → Pages
- [ ] Site accessible at https://cholerawatch.com

## Expected Result

After DNS propagates:
- ✅ Site accessible at **https://cholerawatch.com**
- ✅ HTTPS certificate active (green lock icon)
- ✅ React dashboard loads correctly
- ✅ All assets load (CSS, JS, images)

## Note

The `CNAME` file should contain just:
```
cholerawatch.com
```

GitHub creates this automatically when you add the domain in Settings. Don't manually edit it unless necessary.

