# تشغيل LiveKit على Windows بدون Docker

## الطريقة 1: تحميل LiveKit Binary (الأسهل)

### 1. تحميل LiveKit Server

قم بتحميل أحدث إصدار من LiveKit:
https://github.com/livekit/livekit/releases

اختر الملف المناسب لـ Windows:
- `livekit_X.X.X_windows_amd64.zip`

### 2. فك الضغط

فك ضغط الملف في مجلد مثل:
```
C:\livekit\
```

### 3. إنشاء ملف الإعدادات

أنشئ ملف `livekit.yaml` في نفس المجلد:

```yaml
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 60000
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

### 4. تشغيل LiveKit

افتح PowerShell في مجلد LiveKit وشغّل:

```powershell
.\livekit-server.exe --config livekit.yaml
```

يجب أن ترى:
```
INFO    starting LiveKit server     {"version": "..."}
INFO    rtc server listening        {"addr": ":7880"}
```

---

## الطريقة 2: استخدام Docker لـ LiveKit فقط

إذا كان Docker مثبت، يمكنك تشغيل LiveKit فقط:

### 1. إنشاء ملف docker-compose-livekit.yml

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - livekit-net

  livekit:
    image: livekit/livekit-server:latest
    command: --config /etc/livekit.yaml
    ports:
      - "7880:7880"
      - "7881:7881"
      - "50000-50100:50000-50100/udp"
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml
    depends_on:
      - redis
    networks:
      - livekit-net

networks:
  livekit-net:
    driver: bridge
```

### 2. إنشاء livekit.yaml

```yaml
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 50100
  use_external_ip: false
  
redis:
  address: redis:6379

keys:
  devkey: secret

room:
  auto_create: true
  empty_timeout: 300
  max_participants: 20

logging:
  level: info
```

### 3. تشغيل Docker Compose

```powershell
docker compose -f docker-compose-livekit.yml up -d
```

---

## التحقق من التشغيل

بعد تشغيل LiveKit، تحقق من أنه يعمل:

### 1. افتح المتصفح على:
```
http://localhost:7880
```

يجب أن ترى رسالة من LiveKit Server

### 2. تحقق من Logs:
```powershell
# إذا كنت تستخدم Binary
# انظر للـ console output

# إذا كنت تستخدم Docker
docker logs livekit
```

---

## للاستخدام على الشبكة المحلية (LAN)

### 1. احصل على IP المحلي:

```powershell
ipconfig
```

ابحث عن IPv4 Address (مثل: 192.168.1.100)

### 2. حدّث ملف .env في Frontend:

في `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://192.168.1.100:3001
NEXT_PUBLIC_LIVEKIT_URL=ws://192.168.1.100:7880
```

### 3. حدّث ملف .env في Backend:

في `apps/api/.env`:

```env
LIVEKIT_URL=ws://192.168.1.100:7880
CORS_ORIGIN=http://192.168.1.100:3000
```

### 4. أعد تشغيل Backend و Frontend

```powershell
# Terminal 1 - Backend
cd d:\live_app\apps\api
npm run dev

# Terminal 2 - Frontend  
cd d:\live_app\apps\web
npm run dev
```

### 5. شارك الرابط مع الآخرين على نفس الشبكة:

```
http://192.168.1.100:3000
```

---

## استكشاف الأخطاء

### خطأ: "websocket closed"
- تأكد من أن LiveKit يعمل على البورت 7880
- تحقق من أن الـ URL صحيح في `.env.local`

### خطأ: "could not establish signal connection"
- تأكد من أن Redis يعمل (إذا كنت تستخدم Docker)
- تحقق من الـ firewall - قد يحتاج LiveKit للسماح بالاتصالات

### للوصول من أجهزة أخرى على الشبكة:
- افتح Windows Firewall
- أضف قاعدة Inbound Rule للبورتات:
  - 3000 (Frontend)
  - 3001 (Backend)
  - 7880 (LiveKit)
  - 50000-50100 (RTC)
