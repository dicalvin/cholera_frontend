# Vercel Memory Limit Fix

## Issue
Vercel Hobby plan has a **2048 MB memory limit** for Serverless Functions. The previous configuration used 3008 MB, which exceeded this limit.

## Fixes Applied

### 1. Memory Limit Reduced
- Updated `vercel.json` to use **2048 MB** (maximum for Hobby plan)
- This is the highest memory allocation available on the free tier

### 2. Node.js Version Specification
- Added `engines` field to `package.json` (Node >= 18.0.0)
- Created `.node-version` file (Node 18)
- Created `.nvmrc` file (Node 18)
- This ensures Vercel uses the correct Node.js version during build

### 3. Memory Optimization
- Added garbage collection before and after model loading
- Model loading is lazy (only when needed)
- Models are excluded from build process (`.vercelignore`)

## If Memory Issues Persist

If you still encounter memory errors, consider these alternatives:

### Option 1: Use Smaller Models
- Prefer **Lasso** or **Ridge** models over **XGBoost** or **Voting Ensemble**
- XGBoost and Voting Ensemble models are typically larger and use more memory

### Option 2: External Model Storage
Store models in cloud storage and download on-demand:

```python
# Example: Download from S3/Google Cloud Storage
import boto3
import tempfile

def load_model_from_s3():
    s3 = boto3.client('s3')
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        s3.download_fileobj('your-bucket', 'model.pkl', tmp)
        model = joblib.load(tmp.name)
    return model
```

### Option 3: Model Quantization
Reduce model size using quantization techniques:
- Use smaller data types (float32 → float16)
- Prune unnecessary model components
- Use model compression libraries

### Option 4: Upgrade Vercel Plan
- **Pro plan**: Up to 3008 MB memory
- **Enterprise plan**: Custom memory limits

### Option 5: Alternative Deployment
- **Render.com**: Free tier with 512 MB, paid plans with more memory
- **Railway**: Flexible memory options
- **Fly.io**: Custom memory allocation
- **AWS Lambda**: Up to 10 GB memory (pay per use)

## Current Configuration

```json
{
  "functions": {
    "api/index.py": {
      "memory": 2048,
      "maxDuration": 30,
      "runtime": "python3.9"
    }
  }
}
```

## Testing

After deployment, test the API:
```bash
curl https://your-app.vercel.app/api/health
```

If models are too large, you'll see:
- Memory errors in Vercel logs
- "Model not found" errors (if model loading fails)
- Timeout errors (if loading takes too long)

## Recommendations

1. **Check model file sizes**: Large models (>100 MB) may cause issues
2. **Monitor Vercel logs**: Check for memory warnings
3. **Test with smallest model first**: Start with Lasso/Ridge before trying XGBoost
4. **Consider model optimization**: Compress or quantize models if needed

