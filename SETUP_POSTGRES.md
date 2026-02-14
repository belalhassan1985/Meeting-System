# إعداد PostgreSQL للتطوير المحلي

## 1. إنشاء قاعدة البيانات

افتح pgAdmin أو psql واكتب:

```sql
-- إنشاء قاعدة البيانات
CREATE DATABASE arabicmeet;

-- إنشاء المستخدم
CREATE USER arabicmeet WITH PASSWORD 'changeme123';

-- منح الصلاحيات
GRANT ALL PRIVILEGES ON DATABASE arabicmeet TO arabicmeet;

-- الاتصال بقاعدة البيانات
\c arabicmeet

-- منح صلاحيات على schema
GRANT ALL ON SCHEMA public TO arabicmeet;
```

## 2. التحقق من الاتصال

```powershell
# من PowerShell
psql -U arabicmeet -d arabicmeet -h localhost
# كلمة المرور: changeme123
```

## 3. تحديث ملف .env

تأكد من أن `apps/api/.env` يحتوي على:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=arabicmeet
DATABASE_PASSWORD=changeme123
DATABASE_NAME=arabicmeet
NODE_ENV=development
```

## 4. تشغيل API

بعد إنشاء قاعدة البيانات:

```powershell
cd d:\live_app\apps\api
npm run dev
```

سيقوم TypeORM تلقائياً بإنشاء الجداول (Tables) عند أول تشغيل!

## ملاحظة مهمة

إذا كنت تستخدم pgAdmin:
- Server: localhost
- Port: 5432  
- Username: postgres (للدخول الأول)
- Password: admin (كما ذكرت)

ثم قم بإنشاء قاعدة البيانات `arabicmeet` والمستخدم `arabicmeet` من داخل pgAdmin.
