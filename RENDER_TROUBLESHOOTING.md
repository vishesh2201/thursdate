# 🔧 Render Deployment Troubleshooting

## Current Issue: "Cannot GET /api/health"

This means the server isn't responding to the health check endpoint. Here's how to fix it:

---

## ✅ **Immediate Fixes Applied**

I've updated your `server.js` with:
1. ✅ Better CORS configuration (allows all origins for now)
2. ✅ Multiple health check endpoints:
   - `GET /` - Root endpoint
   - `GET /health` - Simple health check
   - `GET /api/health` - Full health check
3. ✅ Environment info in health response

---

## 🚀 **Steps to Fix Your Deployment**

### **Step 1: Commit and Push Changes**
```bash
git add .
git commit -m "Fix health endpoint and CORS configuration"
git push origin main
```

### **Step 2: Check Render Logs**
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click on your `sundate-backend` service
3. Go to **Logs** tab
4. Look for errors:
   - ❌ "Cannot find module" → Missing dependencies
   - ❌ "ECONNREFUSED" → Database connection failed
   - ❌ "Port already in use" → Port conflict
   - ❌ "JWT_SECRET is not defined" → Missing env var
   - ✅ "Server running on port 10000" → Good!

### **Step 3: Verify Environment Variables**
In Render Dashboard → **Environment** tab:

**Critical Variables (Must be set):**
- ✅ `NODE_ENV=production`
- ✅ `PORT=10000`
- ❓ `JWT_SECRET` (auto-generated or set manually)
- ❓ `DB_HOST` (your Aiven MySQL host)
- ❓ `DB_USER` (your database username)
- ❓ `DB_PASSWORD` (your database password)
- ❓ `DB_NAME=defaultdb`
- ❓ `DB_PORT=3306`

**Optional but Recommended:**
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `FRONTEND_URL`
- `ADMIN_EMAILS`

### **Step 4: Manual Redeploy**
After pushing changes:
1. In Render Dashboard → Your Service
2. Click **Manual Deploy** → **Deploy latest commit**
3. Wait 3-5 minutes for deployment
4. Check logs for "Server running on port 10000"

### **Step 5: Test Endpoints**
Try these URLs in order:

```bash
# 1. Root endpoint (simplest)
https://sundate-backend.onrender.com/

# 2. Simple health check
https://sundate-backend.onrender.com/health

# 3. Full health check
https://sundate-backend.onrender.com/api/health
```

One of these should work! They all return JSON.

---

## 🐛 **Common Issues & Solutions**

### Issue 1: "Application failed to respond"
**Cause:** Server crashed during startup  
**Solution:**
1. Check Render logs for error messages
2. Most common: Missing `JWT_SECRET` or database credentials
3. Add missing environment variables
4. Redeploy

### Issue 2: "This site can't be reached"
**Cause:** Server not running or wrong URL  
**Solution:**
1. Verify URL is correct: `https://sundate-backend.onrender.com`
2. Check Render dashboard shows "Live" status (green)
3. If "Deploying" → wait for it to finish
4. If "Failed" → check logs

### Issue 3: "Cannot connect to database"
**Cause:** Wrong database credentials or host  
**Solution:**
1. Go to Aiven Cloud dashboard
2. Copy exact connection details
3. Update in Render Environment variables:
   ```
   DB_HOST=mysql-3443417d-thefrick-374d.k.aivencloud.com
   DB_USER=<from-aiven>
   DB_PASSWORD=<from-aiven>
   DB_NAME=defaultdb
   DB_PORT=3306
   ```
4. **Note:** Some MySQL hosts require SSL, add if needed:
   ```
   DB_SSL_CA=true
   ```

### Issue 4: "Cloudinary connection failed"
**Cause:** Missing or wrong Cloudinary credentials  
**Solution:**
1. This is **non-critical** - server will still run
2. Image uploads won't work without it
3. Get credentials from [Cloudinary Console](https://cloudinary.com/console)
4. Add to Render environment variables

### Issue 5: "Free tier sleeping"
**Cause:** Normal behavior on free tier  
**Solution:**
- Free tier sleeps after 15 minutes of inactivity
- First request takes 30-60 seconds to wake up
- Subsequent requests are fast
- Upgrade to Starter plan ($7/mo) for 24/7 uptime

---

## 📊 **Diagnostic Commands**

### Check if server is responding:
```bash
curl https://sundate-backend.onrender.com/health
```

### Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-11T12:00:00.000Z"
}
```

### Check with verbose output:
```bash
curl -v https://sundate-backend.onrender.com/health
```

---

## 🔍 **What to Look for in Render Logs**

### ✅ **Good Signs:**
```
npm install completed
Starting server...
✅ Database connected successfully
Server running on port 10000
Socket.IO server ready
```

### ❌ **Bad Signs:**
```
Error: Cannot find module 'dotenv'
→ Build failed, dependencies not installed

Error: connect ECONNREFUSED
→ Database connection failed

Error: JWT_SECRET is not defined
→ Missing environment variable

Error: listen EADDRINUSE
→ Port conflict (shouldn't happen on Render)
```

---

## 🎯 **Quick Checklist**

Before testing again, verify:
- [ ] Code pushed to GitHub (with latest server.js changes)
- [ ] Render connected to correct GitHub repo
- [ ] Root directory set to `backend` in Render
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`
- [ ] Environment variables set (at least `PORT` and `JWT_SECRET`)
- [ ] Deployment status shows "Live" (green)
- [ ] Logs show "Server running on port 10000"

---

## 💡 **Next Steps**

1. **Push the updated code** (with new server.js)
2. **Wait for auto-deploy** (or trigger manual deploy)
3. **Check logs** for any errors
4. **Test root endpoint first:** `https://sundate-backend.onrender.com/`
5. **Then test health:** `https://sundate-backend.onrender.com/api/health`

---

## 📞 **Still Not Working?**

If you're still getting "Cannot GET /api/health":

1. **Share the Render logs** (last 50 lines)
2. **Verify environment variables** are set
3. **Check deployment status** (Live vs Failed)
4. **Try the root endpoint** (`/`) instead

The most common issue is **missing environment variables** causing the server to crash on startup.

---

## ✅ **Success Indicators**

When it's working, you'll see:
- Render dashboard shows **"Live"** status (green dot)
- Logs show **"Server running on port 10000"**
- GET requests return JSON (not HTML error pages)
- Response time is fast (not timeout)

**Test it:**
```bash
curl https://sundate-backend.onrender.com/health
```

**Should return:**
```json
{"status":"ok","timestamp":"2026-02-11T..."}
```

Now push your changes and redeploy! 🚀
