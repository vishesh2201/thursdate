# 🚀 Deployment Guide - Vercel (Frontend) + Render (Backend)

This guide will help you deploy Thursdate from scratch with zero issues.

---

## 📋 Pre-Deployment Checklist

- [ ] GitHub repository created and code pushed
- [ ] Aiven MySQL database is accessible (already set up ✅)
- [ ] Cloudinary account created
- [ ] AWS Rekognition configured (optional)
- [ ] Vercel account created
- [ ] Render account created

---

## 🎯 Deployment Steps

### **STEP 1: Deploy Backend to Render** (Do this FIRST!)

#### 1.1 Create New Web Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the repository containing this code

#### 1.2 Configure Service
```
Name: thursdate-backend
Region: Oregon (or your preferred region)
Branch: main
Root Directory: backend
Environment: Node
Build Command: npm install
Start Command: npm start
Plan: Free (or Starter $7/mo for 24/7 uptime)
```

#### 1.3 Set Environment Variables
In Render Dashboard, go to **Environment** tab and add these:

**Required Variables:**
```bash
NODE_ENV=production
PORT=10000
DB_HOST=mysql-3443417d-thefrick-374d.k.aivencloud.com
DB_USER=<your-aiven-username>
DB_PASSWORD=<your-aiven-password>
DB_NAME=defaultdb
DB_PORT=3306
JWT_SECRET=<generate-random-string>
CLOUDINARY_CLOUD_NAME=<from-cloudinary-console>
CLOUDINARY_API_KEY=<from-cloudinary-console>
CLOUDINARY_API_SECRET=<from-cloudinary-console>
ADMIN_EMAILS=admin@example.com
FRONTEND_URL=https://thursdate.vercel.app
SENDGRID_API_KEY=<your-sendgrid-api-key>
SENDGRID_FROM_EMAIL=noreply@thursdate.app
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**How to get SendGrid API Key:**
1. Go to https://sendgrid.com/ and create a free account (100 emails/day)
2. Verify your email address
3. Go to Settings → API Keys
4. Click "Create API Key"
5. Name it "Thursdate Production"
6. Select "Full Access" or "Restricted Access" with Mail Send permissions
7. Copy the API key (starts with "SG.")
8. Use this as SENDGRID_API_KEY

**How to verify sender email:**
1. In SendGrid dashboard, go to Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Fill in your details with the email you want to use (e.g., noreply@yourdomain.com)
4. SendGrid will send a verification email
5. Click the link to verify
6. Use this email as SENDGRID_FROM_EMAIL

**Note:** SendGrid free tier allows 100 emails/day. For higher volume, upgrade to a paid plan.

**Optional Variables (if using AWS Rekognition for face verification):**
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
```

#### 1.4 Deploy Backend
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. **Copy your backend URL:** `https://thursdate-backend.onrender.com`

#### 1.5 Update FRONTEND_URL
1. Go back to **Environment** variables
2. Update `FRONTEND_URL` to your Vercel URL (you'll deploy this next)
3. Click **"Save Changes"** (will auto-redeploy)

#### 1.6 Test Backend
```bash
curl https://thursdate-backend.onrender.com/api/health
```
Should return: `{"status":"ok","timestamp":"...","uptime":123}`

---

### **STEP 2: Deploy Frontend to Vercel**

#### 2.1 Install Vercel CLI (Optional)
```bash
npm i -g vercel
```

#### 2.2 Deploy via Vercel Dashboard (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..." → "Project"**
3. Import your GitHub repository
4. Configure project:
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

#### 2.3 Set Environment Variables
In **Environment Variables** section, add:
```
VITE_BACKEND_API_URL=https://thursdate-backend.onrender.com/api
```

#### 2.4 Deploy
1. Click **"Deploy"**
2. Wait for deployment (2-5 minutes)
3. **Copy your frontend URL:** `https://thursdate.vercel.app`

#### 2.5 Update Backend CORS
1. Go back to **Render Dashboard**
2. Update `FRONTEND_URL` environment variable to your actual Vercel URL
3. Save changes (will trigger redeploy)

---

### **STEP 3: Database Setup**

Your database is already on Aiven Cloud, but you need to run migrations:

#### 3.1 Connect to Database via Render Shell
1. In Render Dashboard → Your Web Service
2. Click **"Shell"** tab
3. Run migrations:
   ```bash
   node migrations/run-sql-migration.js migrations/create-chat-tables.sql
   node migrations/run-sql-migration.js migrations/create-daily-games.sql
   node migrations/run-sql-migration.js migrations/create-match-levels.sql
   node migrations/run-sql-migration.js migrations/add-profile-level-system.sql
   node run-daily-games-migration.js
   ```

---

## ✅ Post-Deployment Verification

### Test Checklist:
- [ ] Backend health endpoint: `https://your-backend.onrender.com/api/health`
- [ ] Frontend loads: `https://your-frontend.vercel.app`
- [ ] User registration works
- [ ] Image upload works (Cloudinary)
- [ ] Chat messaging works (Socket.IO)
- [ ] Daily game loads

---

## 🔧 Important Notes

### **Render Free Tier Limitations:**
- Backend sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- Upgrade to **Starter Plan ($7/mo)** for 24/7 uptime

### **CORS Issues:**
If you get CORS errors:
1. Check `FRONTEND_URL` in Render matches Vercel URL exactly
2. Include `https://` in the URL
3. No trailing slash
4. Redeploy backend after changing

### **Database Connection:**
- Your Aiven MySQL is already set up ✅
- Make sure DB credentials are correct in Render
- Check firewall rules allow Render IPs

### **Environment Variables:**
- Update `FRONTEND_URL` in backend when frontend URL changes
- Update `VITE_BACKEND_API_URL` in frontend when backend URL changes
- Changes require redeployment

---

## 🐛 Troubleshooting

### Backend won't start:
```bash
# Check logs in Render Dashboard → Logs tab
# Common issues:
# - Missing environment variables
# - Database connection failed
# - Port conflicts (use PORT=10000)
```

### Frontend can't connect to backend:
```bash
# Check browser console for errors
# Verify VITE_BACKEND_API_URL is set correctly
# Check CORS settings in backend
# Ensure backend is awake (make a health check request)
```

### Socket.IO not connecting:
```bash
# Ensure backend URL doesn't include /api
# Check that JWT token is being sent
# Verify WebSocket connections allowed in Render
```

---

## 🔄 Redeployment (Fresh Start)

If you need to start completely fresh:

### Clear Previous Deployments:
1. **Render:** Delete the web service
2. **Vercel:** Delete the project
3. **Local:** Delete `.vercel` folder (if exists)

### Start Fresh:
1. Follow **STEP 1** again (Backend)
2. Follow **STEP 2** again (Frontend)
3. No need to recreate database (keep Aiven)

---

## 🔐 Security Reminders

Before deploying:
- [ ] Change default JWT_SECRET
- [ ] Update ADMIN_EMAILS
- [ ] Don't commit `.env` files
- [ ] Use strong database passwords
- [ ] Enable 2FA on Vercel/Render accounts

---

## 📞 Need Help?

Common issues:
1. **"Cannot connect to database"** → Check Aiven connection string and credentials
2. **"CORS error"** → Verify FRONTEND_URL matches exactly
3. **"Backend sleeps"** → Normal on free tier, upgrade to Starter plan
4. **"Build failed"** → Check build logs for missing dependencies

---

## 🎉 Success!

Once deployed, your app will be accessible at:
- **Frontend:** `https://thursdate.vercel.app`
- **Backend:** `https://thursdate-backend.onrender.com`
- **Health Check:** `https://thursdate-backend.onrender.com/api/health`

Share these URLs for testing! 🚀
