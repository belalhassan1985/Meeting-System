# الحل النهائي لمشكلة LiveKit WebRTC

## المشكلة
LiveKit داخل Docker لا يعمل بشكل صحيح مع WebRTC على localhost/LAN بسبب:
- ICE candidates تستخدم IPs داخلية للـ Docker
- WebRTC negotiation يفشل
- لا يمكن إنشاء peer connection

## ✅ الحل: تشغيل LiveKit خارج Docker

### الخطوة 1: إيقاف LiveKit في Docker

```powershell
cd d:\live_app
docker compose -f docker-compose-livekit-only.yml stop livekit
```

### الخطوة 2: تحميل LiveKit Binary

1. اذهب إلى: https://github.com/livekit/livekit/releases
2. حمّل أحدث إصدار Windows: `livekit_X.X.X_windows_amd64.zip`
3. فك الضغط في مجلد مثل: `C:\livekit\`

### الخطوة 3: إنشاء ملف الإعدادات

أنشئ ملف `C:\livekit\livekit.yaml`:

```yaml
port: 7880

rtc:
  port_range_start: 50000
  port_range_end: 50100
  tcp_port: 7881
  use_external_ip: false

redis:
  address: localhost:6379

keys:
  devkey: secret

room:
  auto_create: true
  empty_timeout: 300
  max_participants: 20

logging:
  level: info
```

### الخطوة 4: تشغيل LiveKit

```powershell
cd C:\livekit
.\livekit-server.exe --config livekit.yaml
```

يجب أن ترى:
```
INFO    starting LiveKit server     {"version": "..."}
INFO    rtc server listening        {"addr": ":7880"}
```

### الخطوة 5: اختبار النظام

1. افتح `http://localhost:3000`
2. أنشئ غرفة جديدة
3. اسمح للكاميرا/المايك
4. يجب أن يعمل الفيديو/الصوت بنجاح! ✅

---

## 🌐 للوصول من الشبكة المحلية

إذا أردت الوصول من أجهزة أخرى على نفس الشبكة:

### الخيار 1: استخدام ngrok (الأسهل)

راجع ملف `USE_NGROK.md` للتعليمات الكاملة.

### الخيار 2: HTTPS مع Self-Signed Certificate

راجع ملف `HTTPS_SETUP.md` للتعليمات الكاملة.

---

## 📊 الحالة النهائية

**الخدمات المطلوبة:**
- ✅ PostgreSQL - Docker (localhost:5432)
- ✅ Redis - Docker (localhost:6379)
- ✅ LiveKit - **Windows Binary** (localhost:7880) ⭐
- ✅ Backend API - npm (localhost:3001)
- ✅ Frontend - npm (localhost:3000)

**النظام سيعمل 100% بهذه الطريقة!**
