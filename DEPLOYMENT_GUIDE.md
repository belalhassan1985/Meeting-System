# 🚀 دليل نشر التحديثات على Coolify

## 📋 ملخص التغييرات

### 1. قاعدة البيانات
- إضافة جدول `recordings` جديد
- إضافة Foreign Keys للربط مع `rooms` و `users`
- إضافة Indexes لتحسين الأداء

### 2. Backend (API)
- إضافة Global Prefix `/api` لجميع الـ endpoints
- إضافة endpoints جديدة للتسجيل المحلي:
  - `POST /api/recordings/start/:roomId`
  - `POST /api/recordings/stop/:recordingId`
  - `POST /api/recordings/upload/:recordingId`
  - `GET /api/recordings/download/:filename`
  - `GET /api/recordings`
  - `DELETE /api/recordings/:recordingId`

### 3. Frontend (Web)
- تحديث جميع API calls لاستخدام `/api` prefix
- إضافة نظام التسجيل المحلي باستخدام MediaRecorder API
- إضافة صفحة إدارة التسجيلات

---

## 🔧 خطوات النشر

### الخطوة 1: تحديث قاعدة البيانات

#### أ) الاتصال بقاعدة البيانات في Production

```bash
# من خلال Coolify Dashboard
# اذهب إلى Database Service -> Terminal
# أو عبر SSH:
psql -h <database_host> -U <database_user> -d <database_name>
```

#### ب) تنفيذ SQL Script

```bash
# من مجلد المشروع
psql -h <database_host> -U <database_user> -d <database_name> -f deploy-recordings-table.sql
```

أو انسخ محتوى الملف وقم بتنفيذه مباشرة في psql.

---

### الخطوة 2: تحديث المتغيرات البيئية في Coolify

#### Backend (API) Environment Variables:
```env
# Database
DATABASE_HOST=<production_db_host>
DATABASE_PORT=5432
DATABASE_USER=arabicmeet
DATABASE_PASSWORD=<secure_password>
DATABASE_NAME=arabicmeet

# Server
PORT=3001
NODE_ENV=production

# LiveKit (إن كان مستخدم)
LIVEKIT_API_KEY=<your_key>
LIVEKIT_API_SECRET=<your_secret>
LIVEKIT_URL=<your_livekit_url>
```

#### Frontend (Web) Environment Variables:
```env
# API URL - مهم جداً!
NEXT_PUBLIC_API_URL=https://yourdomain.com
# أو إذا كان API على subdomain منفصل:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# LiveKit
NEXT_PUBLIC_LIVEKIT_URL=<your_livekit_url>
```

---

### الخطوة 3: تحديث Docker Configuration

#### إضافة Volume للملفات المرفوعة

في `docker-compose.yml` أو Coolify Settings:

```yaml
services:
  api:
    volumes:
      # لحفظ ملفات التسجيل
      - api-uploads:/app/apps/api/uploads
    environment:
      - PORT=3001
      - DATABASE_HOST=${DATABASE_HOST}
      # ... باقي المتغيرات

volumes:
  api-uploads:
    driver: local
```

**ملاحظة:** في Coolify، يمكنك إضافة Persistent Storage من:
- Dashboard -> Service -> Storage -> Add Persistent Storage
- Source: `api-uploads`
- Destination: `/app/apps/api/uploads`

---

### الخطوة 4: تحديث Nginx/Reverse Proxy

إذا كنت تستخدم Nginx أو Traefik، تأكد من:

```nginx
# زيادة حجم الملفات المسموح برفعها
client_max_body_size 500M;

# Proxy للـ API
location /api/ {
    proxy_pass http://api:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    
    # Timeouts للملفات الكبيرة
    proxy_connect_timeout 600;
    proxy_send_timeout 600;
    proxy_read_timeout 600;
    send_timeout 600;
}

# Proxy للملفات الثابتة
location /uploads/ {
    proxy_pass http://api:3001/uploads/;
}
```

في Coolify، يمكنك إضافة هذا في:
- Dashboard -> Service -> Advanced -> Custom Nginx Config

---

### الخطوة 5: Push الكود إلى Git

```bash
# تأكد من أنك في مجلد المشروع
cd d:/live_app

# إضافة جميع التغييرات
git add .

# Commit مع رسالة واضحة
git commit -m "feat: Add local recording system with /api prefix

- Add recordings table to database
- Add /api global prefix to all endpoints  
- Update frontend to use /api prefix
- Implement local recording with MediaRecorder API
- Add download functionality for recordings
- Update all admin pages to work with new API structure"

# Push إلى الـ branch الرئيسي
git push origin main
# أو إذا كنت تستخدم master:
# git push origin master
```

---

### الخطوة 6: إعادة Deploy في Coolify

#### الطريقة الأولى: Auto Deploy (إذا كان مفعّل)
- Coolify سيكتشف التغييرات تلقائياً من Git
- انتظر 1-2 دقيقة وسيبدأ البناء تلقائياً

#### الطريقة الثانية: Manual Deploy
1. اذهب إلى Coolify Dashboard
2. اختر مشروعك
3. اضغط على **"Redeploy"** أو **"Force Rebuild"**
4. انتظر حتى ينتهي البناء (5-10 دقائق)

#### الطريقة الثالثة: Webhook
```bash
curl -X POST <your_coolify_webhook_url>
```

---

### الخطوة 7: التحقق من النشر

#### أ) فحص الـ Logs
```bash
# من Coolify Dashboard
Dashboard -> Service -> Logs

# ابحث عن:
# ✅ "Nest application successfully started"
# ✅ "Mapped {/api/recordings/download/:filename, GET}"
# ✅ "Arabic Meet API running on: http://localhost:3001"
```

#### ب) اختبار الـ Endpoints
```bash
# اختبر API Health
curl https://yourdomain.com/api/recordings

# اختبر تسجيل الدخول
curl -X POST https://yourdomain.com/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'
```

#### ج) اختبر من المتصفح
1. افتح `https://yourdomain.com/login`
2. سجل دخول
3. انضم لغرفة
4. جرب التسجيل المحلي
5. تحقق من صفحة `/admin/recordings`

---

## 🔍 استكشاف الأخطاء

### مشكلة: 404 Not Found على جميع الـ endpoints

**الحل:**
- تأكد من أن `NEXT_PUBLIC_API_URL` صحيح في Frontend
- تأكد من أن Nginx يوجه `/api/` إلى Backend
- تحقق من Logs: هل الـ endpoints مسجلة بشكل صحيح؟

### مشكلة: Database Connection Failed

**الحل:**
```bash
# تحقق من المتغيرات البيئية
echo $DATABASE_HOST
echo $DATABASE_USER

# اختبر الاتصال
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT 1"
```

### مشكلة: ملفات التسجيل لا تُحفظ

**الحل:**
- تأكد من وجود Volume في Docker
- تحقق من الصلاحيات: `chmod 777 uploads/recordings/`
- تحقق من المساحة المتاحة: `df -h`

### مشكلة: خطأ 413 Request Entity Too Large

**الحل:**
```nginx
# في Nginx config
client_max_body_size 500M;
```

---

## 📊 مراقبة النظام بعد النشر

### 1. مراقبة الـ Logs
```bash
# من Coolify
Dashboard -> Logs -> Real-time

# ابحث عن:
# - أخطاء في الاتصال بقاعدة البيانات
# - أخطاء في رفع الملفات
# - أخطاء 404 أو 500
```

### 2. مراقبة المساحة
```bash
# حجم مجلد uploads
du -sh /app/apps/api/uploads/recordings/

# عدد الملفات
ls -l /app/apps/api/uploads/recordings/ | wc -l
```

### 3. مراقبة قاعدة البيانات
```sql
-- عدد التسجيلات
SELECT COUNT(*) FROM recordings;

-- حجم الجدول
SELECT pg_size_pretty(pg_total_relation_size('recordings'));

-- التسجيلات الأخيرة
SELECT * FROM recordings ORDER BY "startedAt" DESC LIMIT 10;
```

---

## 🎯 Checklist النشر

- [ ] تحديث قاعدة البيانات (تنفيذ SQL)
- [ ] تحديث المتغيرات البيئية في Coolify
- [ ] إضافة Volume للملفات المرفوعة
- [ ] تحديث Nginx config (حجم الملفات)
- [ ] Push الكود إلى Git
- [ ] إعادة Deploy في Coolify
- [ ] التحقق من الـ Logs
- [ ] اختبار تسجيل الدخول
- [ ] اختبار التسجيل المحلي
- [ ] اختبار تحميل التسجيلات
- [ ] مراقبة النظام لمدة 24 ساعة

---

## 📝 ملاحظات مهمة

1. **Backup قبل النشر:**
   ```bash
   pg_dump -h <host> -U <user> <database> > backup_$(date +%Y%m%d).sql
   ```

2. **TypeORM Synchronize:**
   - في Development: `synchronize: true` ✅
   - في Production: `synchronize: false` ⚠️
   - استخدم Migrations في Production

3. **Object Storage (اختياري):**
   - للملفات الكبيرة، استخدم S3 أو MinIO
   - أفضل من حفظ الملفات في Container

4. **Monitoring:**
   - استخدم Sentry للأخطاء
   - استخدم Prometheus + Grafana للمراقبة

---

## 🆘 الدعم

إذا واجهت أي مشاكل:
1. تحقق من Logs في Coolify
2. تحقق من Database Connection
3. تحقق من Nginx Config
4. تحقق من Environment Variables

---

**تاريخ آخر تحديث:** 18 فبراير 2026
**الإصدار:** 2.0.0 (Local Recording System)
