# Production Setup Guide - Enhanced Messages with WebRTC

## 🚀 Overview

This guide will help you deploy the enhanced messaging system with WebRTC video/audio calls to production. The system includes:

- **Real-time messaging** with local storage persistence
- **WebRTC video/audio calls** with screen sharing
- **Mentor-mentee connection flow** integration
- **Production-grade WebSocket signaling server**

## 📋 Prerequisites

- Node.js 18+ and npm
- A hosting service (Vercel, Netlify, Railway, etc.)
- Domain name (optional but recommended)
- SSL certificate (for WebRTC to work properly)

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │  WebSocket       │    │   Local         │
│   (React App)   │◄──►│  Signaling       │◄──►│   Storage       │
│                 │    │  Server          │    │   (Browser)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│   Static        │    │   Cloud          │
│   Hosting       │    │   Hosting        │
│   (Vercel)      │    │   (Railway)      │
└─────────────────┘    └──────────────────┘
```

## 🔧 Step 1: Prepare the Frontend

### 1.1 Update WebSocket Configuration

Update the WebSocket service to use your production server URL:

```typescript
// src/react-app/services/WebSocketService.ts
export const webSocketService = new WebSocketService('wss://your-signaling-server.com');
```

### 1.2 Build the Frontend

```bash
cd Vidya_Shakthi_Final
npm run build
```

This creates a `dist` folder with optimized production files.

### 1.3 Deploy to Static Hosting

**Option A: Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Option B: Netlify**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

**Option C: Manual Upload**
- Upload the `dist` folder contents to your web server
- Ensure your server serves `index.html` for all routes (SPA routing)

## 🖥️ Step 2: Deploy the WebSocket Server

### 2.1 Prepare the Server

The server is located in the `server/` directory and is already production-ready.

### 2.2 Deploy to Cloud Hosting

**Option A: Railway (Recommended)**
```bash
cd server
# Connect to Railway
railway login
railway init
railway up
```

**Option B: Heroku**
```bash
cd server
# Create Procfile
echo "web: node server.js" > Procfile

# Deploy
git init
git add .
git commit -m "Initial commit"
heroku create your-app-name
git push heroku main
```

**Option C: DigitalOcean App Platform**
1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set run command: `node server.js`
4. Set port: `8080`

### 2.3 Environment Variables

Set these environment variables in your hosting platform:

```bash
PORT=8080
NODE_ENV=production
```

## 🔒 Step 3: SSL/HTTPS Configuration

WebRTC requires HTTPS in production. Ensure both your frontend and WebSocket server use SSL:

### 3.1 Frontend SSL
- Most hosting platforms (Vercel, Netlify) provide SSL automatically
- Custom domains: Use Let's Encrypt or your hosting provider's SSL

### 3.2 WebSocket Server SSL
For Railway/Heroku: SSL is handled automatically
For custom servers: Use a reverse proxy like Nginx with SSL termination

## 🌐 Step 4: Update Frontend Configuration

### 4.1 Update WebSocket URL

After deploying your WebSocket server, update the frontend:

```typescript
// src/react-app/services/WebSocketService.ts
const serverUrl = process.env.NODE_ENV === 'production' 
  ? 'wss://your-signaling-server.railway.app'  // Your production URL
  : 'ws://localhost:8080';  // Development URL

export const webSocketService = new WebSocketService(serverUrl);
```

### 4.2 Environment Variables

Create a `.env.production` file:

```bash
VITE_WEBSOCKET_URL=wss://your-signaling-server.railway.app
VITE_API_BASE_URL=https://your-api-server.com
```

## 🧪 Step 5: Testing

### 5.1 Test Messaging
1. Open your deployed app in two different browsers/incognito windows
2. Create a connection between mentor and mentee
3. Send messages and verify they appear in real-time
4. Check that messages persist after page refresh

### 5.2 Test WebRTC Calls
1. Start an audio call between two users
2. Start a video call between two users
3. Test screen sharing functionality
4. Verify call quality and connection stability

### 5.3 Test Cross-Device
1. Open the app on different devices (phone, tablet, computer)
2. Ensure messages sync across devices
3. Test calls between different devices

## 📊 Step 6: Monitoring and Analytics

### 6.1 WebSocket Server Monitoring

Add logging and monitoring to your server:

```javascript
// server/server.js - Add to constructor
this.setupMonitoring();

setupMonitoring() {
  // Log server stats every 5 minutes
  setInterval(() => {
    console.log(`📊 Server Stats: ${this.clients.size} connected users, ${this.chats.size} active chats`);
  }, 300000);
}
```

### 6.2 Frontend Error Tracking

Add error tracking (Sentry, LogRocket, etc.):

```typescript
// src/react-app/services/ErrorTracking.ts
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV,
});
```

## 🔧 Step 7: Performance Optimization

### 7.1 Frontend Optimizations
- Enable gzip compression on your hosting platform
- Use CDN for static assets
- Implement service worker for offline support

### 7.2 WebSocket Server Optimizations
- Implement connection pooling
- Add rate limiting
- Use Redis for scaling (if needed)

## 🚨 Step 8: Security Considerations

### 8.1 WebSocket Security
```javascript
// server/server.js - Add authentication
verifyClient: (info) => {
  const token = info.req.url.split('token=')[1];
  // Verify JWT token here
  return isValidToken(token);
}
```

### 8.2 CORS Configuration
```javascript
// server/server.js - Restrict origins in production
verifyClient: (info) => {
  const allowedOrigins = ['https://your-frontend-domain.com'];
  return allowedOrigins.includes(info.origin);
}
```

## 📱 Step 9: Mobile Optimization

### 9.1 PWA Configuration
Add a web app manifest for mobile installation:

```json
// public/manifest.json
{
  "name": "Vidya Shakthi Messages",
  "short_name": "VS Messages",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6"
}
```

### 9.2 Mobile-Specific Features
- Add touch gestures for call controls
- Optimize video call UI for mobile screens
- Implement push notifications for incoming calls

## 🔄 Step 10: Backup and Recovery

### 10.1 Data Backup
Since we're using local storage, implement data export/import:

```typescript
// Users can export their data
const exportData = () => {
  const data = localStorageService.exportData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'messages-backup.json';
  a.click();
};
```

### 10.2 Server Backup
- Regular database backups (if you add a database later)
- Configuration backups
- SSL certificate backups

## 🎯 Production Checklist

- [ ] Frontend deployed with SSL
- [ ] WebSocket server deployed with SSL
- [ ] WebSocket URL updated in frontend
- [ ] CORS configured for production domains
- [ ] Error tracking implemented
- [ ] Monitoring set up
- [ ] Performance optimized
- [ ] Security measures in place
- [ ] Mobile optimization complete
- [ ] Backup strategy implemented
- [ ] Cross-device testing completed
- [ ] Load testing performed

## 🆘 Troubleshooting

### Common Issues

**WebRTC calls not working:**
- Ensure both frontend and server use HTTPS
- Check firewall settings
- Verify STUN servers are accessible

**Messages not syncing:**
- Check WebSocket connection status
- Verify server is running and accessible
- Check browser console for errors

**Poor call quality:**
- Check network bandwidth
- Verify STUN/TURN server configuration
- Test with different browsers

### Support

For issues or questions:
1. Check browser console for errors
2. Check server logs
3. Test with different browsers/devices
4. Verify network connectivity

## 🎉 You're Ready!

Your production-grade messaging system with WebRTC is now deployed and ready for users! The system provides:

- ✅ Real-time messaging with local storage
- ✅ High-quality video/audio calls
- ✅ Screen sharing capabilities
- ✅ Mentor-mentee connection flow
- ✅ Cross-device compatibility
- ✅ Production-grade reliability

Enjoy your enhanced communication platform! 🚀
