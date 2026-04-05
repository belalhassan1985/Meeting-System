# حل مشكلة HTTPS للوصول للكاميرا/المايك

## المشكلة
المتصفحات الحديثة تطلب HTTPS للوصول للكاميرا/المايك عند استخدام IP غير localhost.

## الحلول المتاحة

---

### ✅ الحل 1: استخدام localhost فقط (الأسهل للتطوير)

**على نفس الجهاز:**
```
http://localhost:3000
```

هذا يعمل بدون HTTPS لأن المتصفحات تثق في localhost.

**للأجهزة الأخرى:** استخدم أحد الحلول التالية.

---

### ✅ الحل 2: استخدام ngrok (موصى به للتطوير)

ngrok يوفر HTTPS tunnel مجاني:

#### 1. تحميل ngrok:
```
https://ngrok.com/download
```

#### 2. تشغيل ngrok:
```powershell
# Terminal 1 - Frontend tunnel
ngrok http 3000

# Terminal 2 - Backend tunnel  
ngrok http 3001

# Terminal 3 - LiveKit tunnel
ngrok http 7880
```

#### 3. استخدم الـ URLs من ngrok:
```
Frontend: https://xxxx-xx-xx-xx-xx.ngrok-free.app
Backend: https://yyyy-yy-yy-yy-yy.ngrok-free.app
LiveKit: wss://zzzz-zz-zz-zz-zz.ngrok-free.app
```

#### 4. حدّث `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://yyyy-yy-yy-yy-yy.ngrok-free.app
NEXT_PUBLIC_LIVEKIT_URL=wss://zzzz-zz-zz-zz-zz.ngrok-free.app
```

---

### ✅ الحل 3: Self-Signed Certificate (للشبكة المحلية)

#### 1. إنشاء شهادة SSL:

```powershell
# تثبيت mkcert
choco install mkcert

# إنشاء CA محلي
mkcert -install

# إنشاء شهادة للـ IP المحلي
mkcert 192.168.100.154 localhost 127.0.0.1
```

#### 2. تحديث Next.js لاستخدام HTTPS:

أنشئ `server.js` في `apps/web`:

```javascript
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync('./192.168.100.154+2-key.pem'),
  cert: fs.readFileSync('./192.168.100.154+2.pem'),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on https://192.168.100.154:3000');
  });
});
```

#### 3. تشغيل:
```powershell
node server.js
```

---

### ✅ الحل 4: استخدام Chrome Flags (للتطوير فقط)

**تحذير: هذا غير آمن - للتطوير فقط!**

#### على كل جهاز، افتح Chrome:
```
chrome://flags/#unsafely-treat-insecure-origin-as-secure
```

#### أضف:
```
http://192.168.100.154:3000
```

#### أعد تشغيل Chrome

---

### ✅ الحل 5: استخدام Nginx مع SSL (للإنتاج)

#### 1. إنشاء شهادة:
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt
```

#### 2. تحديث nginx.conf:
```nginx
server {
    listen 443 ssl;
    server_name 192.168.100.154;

    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

---

## التوصية للتطوير السريع

**استخدم localhost على نفس الجهاز:**
```
http://localhost:3000
```

**للاختبار من أجهزة أخرى:**
- استخدم ngrok (الأسهل)
- أو استخدم Chrome flags مؤقتاً

**للإنتاج:**
- استخدم شهادة SSL حقيقية (Let's Encrypt)
- أو استخدم Nginx مع SSL
