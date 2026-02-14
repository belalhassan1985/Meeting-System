# استخدام ngrok للحصول على HTTPS مجاني

## 1. تحميل ngrok
https://ngrok.com/download

أو عبر Chocolatey:
```powershell
choco install ngrok
```

## 2. تشغيل ngrok

افتح 3 terminals:

### Terminal 1 - Frontend:
```powershell
ngrok http 3000
```

### Terminal 2 - Backend:
```powershell
ngrok http 3001
```

### Terminal 3 - LiveKit:
```powershell
ngrok http 7880
```

## 3. انسخ الـ URLs

من كل terminal، انسخ الـ "Forwarding" URL:
```
Forwarding: https://xxxx-xx-xx.ngrok-free.app -> http://localhost:3000
```

## 4. حدّث الإعدادات

### في `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://yyyy-backend-url.ngrok-free.app
NEXT_PUBLIC_LIVEKIT_URL=wss://zzzz-livekit-url.ngrok-free.app
```

### في `apps/api/.env`:
```env
CORS_ORIGIN=https://xxxx-frontend-url.ngrok-free.app
LIVEKIT_URL=ws://localhost:7880
```

## 5. أعد تشغيل Backend و Frontend

```powershell
# أوقف وأعد تشغيل
cd d:\live_app\apps\api
npm run dev

cd d:\live_app\apps\web  
npm run dev
```

## 6. افتح الرابط

```
https://xxxx-frontend-url.ngrok-free.app
```

الآن يعمل مع HTTPS ويمكن الوصول من أي مكان! 🌍
