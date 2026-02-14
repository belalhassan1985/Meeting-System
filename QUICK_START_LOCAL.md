# التشغيل المحلي بدون Docker - Local Development Setup

إذا لم يكن Docker متاحاً، يمكنك تشغيل المشروع محلياً للتطوير والاختبار.

## المتطلبات

- Node.js 20+ ([تحميل](https://nodejs.org/))
- PostgreSQL 15+ ([تحميل](https://www.postgresql.org/download/))
- LiveKit Server ([تحميل](https://github.com/livekit/livekit/releases))

## خطوات التشغيل

### 1. تثبيت PostgreSQL

1. حمّل وثبّت PostgreSQL
2. أنشئ قاعدة بيانات:
```sql
CREATE DATABASE arabicmeet;
CREATE USER arabicmeet WITH PASSWORD 'changeme123';
GRANT ALL PRIVILEGES ON DATABASE arabicmeet TO arabicmeet;
```

### 2. تحميل وتشغيل LiveKit Server

```powershell
# حمّل LiveKit من GitHub Releases
# https://github.com/livekit/livekit/releases

# فك الضغط وانتقل للمجلد
cd livekit-server

# أنشئ ملف config.yaml
@"
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: false
  tcp_port: 7881

keys:
  devkey: secret

room:
  auto_create: true
  max_participants: 50
"@ | Out-File -FilePath config.yaml -Encoding UTF8

# شغّل LiveKit
.\livekit-server --config config.yaml
```

### 3. تثبيت حزم المشروع

```powershell
cd d:\live_app

# تثبيت الحزم الرئيسية
npm install

# بناء shared package
cd packages\shared
npm install
npm run build
cd ..\..

# تثبيت حزم API
cd apps\api
npm install
cd ..\..

# تثبيت حزم Web
cd apps\web
npm install
cd ..\..
```

### 4. إعداد ملفات البيئة

**apps/api/.env:**
```env
PORT=3001
NODE_ENV=development

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=arabicmeet
DATABASE_PASSWORD=changeme123
DATABASE_NAME=arabicmeet

LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
LIVEKIT_URL=ws://localhost:7880

JWT_SECRET=your-local-dev-secret-key

CORS_ORIGIN=http://localhost:3000
```

**apps/web/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_LIVEKIT_URL=ws://localhost:7880
```

### 5. تشغيل الخدمات

افتح 3 نوافذ PowerShell منفصلة:

**نافذة 1 - LiveKit:**
```powershell
cd path\to\livekit-server
.\livekit-server --config config.yaml
```

**نافذة 2 - Backend API:**
```powershell
cd d:\live_app\apps\api
npm run dev
```

**نافذة 3 - Frontend:**
```powershell
cd d:\live_app\apps\web
npm run dev
```

### 6. الوصول للتطبيق

افتح المتصفح:
```
http://localhost:3000
```

## ملاحظات

- **LiveKit**: يجب أن يعمل على البورت 7880
- **Backend**: يعمل على البورت 3001
- **Frontend**: يعمل على البورت 3000
- **PostgreSQL**: يعمل على البورت 5432

## استكشاف الأخطاء

### خطأ: Port already in use

```powershell
# معرفة العملية المستخدمة للبورت
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# إيقاف العملية (استبدل PID)
taskkill /PID <PID> /F
```

### خطأ: Cannot connect to database

تحقق من تشغيل PostgreSQL:
```powershell
# التحقق من خدمة PostgreSQL
Get-Service -Name postgresql*
```

### خطأ: Module not found

```powershell
# إعادة تثبيت الحزم
cd d:\live_app
Remove-Item -Recurse -Force node_modules
npm install

# إعادة بناء shared package
cd packages\shared
npm run build
```

## للإنتاج

للنشر في بيئة الإنتاج، يُنصح بشدة باستخدام Docker كما هو موضح في `DEPLOYMENT.md`.
