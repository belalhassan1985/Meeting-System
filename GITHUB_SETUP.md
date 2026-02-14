# 🚀 إعداد المشروع من GitHub

## 📥 استنساخ المشروع

```bash
git clone https://github.com/your-username/meeting-system.git
cd meeting-system
```

## ⚙️ التثبيت والإعداد

### 1. تثبيت المكتبات

```bash
npm install
```

### 2. إعداد ملفات البيئة

انسخ ملفات `.env.example` إلى `.env`:

```bash
# في الجذر
cp .env.example .env

# في Backend
cp apps/api/.env.example apps/api/.env

# في Frontend
cp apps/web/.env.example apps/web/.env
```

### 3. تعديل ملفات `.env`

افتح الملفات وعدّل القيم حسب بيئتك:

**في `apps/api/.env`:**
- غيّر `DATABASE_PASSWORD` إلى كلمة مرور قوية
- غيّر `JWT_SECRET` إلى نص عشوائي طويل (32+ حرف)
- عدّل `LIVEKIT_WS_URL` إذا كان LiveKit على سيرفر آخر

**في `apps/web/.env.local`:**
- عدّل `NEXT_PUBLIC_API_URL` إذا كان Backend على سيرفر آخر
- عدّل `NEXT_PUBLIC_LIVEKIT_URL` إذا كان LiveKit على سيرفر آخر

### 4. إعداد قاعدة البيانات

#### الطريقة 1: باستخدام Docker

```bash
docker run -d \
  --name arabicmeet-postgres \
  -e POSTGRES_DB=arabicmeet \
  -e POSTGRES_USER=arabicmeet \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  postgres:15-alpine
```

#### الطريقة 2: PostgreSQL محلي

تأكد من تشغيل PostgreSQL وأنشئ قاعدة البيانات:

```sql
CREATE DATABASE arabicmeet;
CREATE USER arabicmeet WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE arabicmeet TO arabicmeet;
```

### 5. إنشاء جدول المسؤولين

```bash
cd apps/api
node scripts/create-admin.js
```

سيتم إنشاء مسؤول افتراضي:
- **اسم المستخدم**: `admin`
- **كلمة المرور**: `admin123`

⚠️ **مهم**: غيّر كلمة المرور بعد أول تسجيل دخول!

### 6. تشغيل LiveKit Server

#### على Windows:

```powershell
# قم بتحميل LiveKit من:
# https://github.com/livekit/livekit/releases

# ثم شغله:
cd C:\livekit
.\livekit-server.exe --config livekit.yaml
```

#### على Linux/Mac:

```bash
# باستخدام Docker
docker run -d \
  --name livekit \
  -p 7880:7880 \
  -p 7881:7881 \
  -p 50000-60000:50000-60000/udp \
  -v ./livekit.yaml:/etc/livekit.yaml \
  livekit/livekit-server:latest \
  --config /etc/livekit.yaml
```

### 7. تشغيل النظام

افتح 3 نوافذ Terminal:

**Terminal 1 - Backend:**
```bash
cd apps/api
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd apps/web
npm run dev
```

**Terminal 3 - LiveKit:**
```bash
# إذا لم يكن يعمل بالفعل
cd C:\livekit
.\livekit-server.exe --config livekit.yaml
```

## 🌐 الوصول للنظام

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **LiveKit**: ws://localhost:7880

## 🔐 تسجيل الدخول الأول

1. افتح http://localhost:3000
2. سيتم توجيهك لصفحة تسجيل الدخول
3. استخدم:
   - **اسم المستخدم**: `admin`
   - **كلمة المرور**: `admin123`
4. بعد تسجيل الدخول، اذهب إلى **لوحة التحكم** → **المسؤولين** وغيّر كلمة المرور

## 📚 مزيد من المعلومات

- راجع `README.md` للمميزات والتقنيات المستخدمة
- راجع `DEPLOYMENT.md` للنشر على VPS
- راجع `SYSTEM_FLOW.md` لفهم تدفق النظام
- راجع `START_SERVERS.md` لتفاصيل تشغيل الخوادم

## 🐛 استكشاف الأخطاء

### المشكلة: Cannot connect to database
**الحل**: تأكد من أن PostgreSQL يعمل وأن بيانات الاتصال صحيحة في `.env`

### المشكلة: CORS Error
**الحل**: تأكد من إضافة `http://localhost:3000` في `CORS_ORIGIN` في Backend

### المشكلة: LiveKit connection failed
**الحل**: 
1. تأكد من أن LiveKit Server يعمل
2. تأكد من أن المنافذ `7880` و `50000-60000` مفتوحة
3. تحقق من `NEXT_PUBLIC_LIVEKIT_URL` في Frontend

### المشكلة: Video/Audio not working
**الحل**: 
1. تأكد من فتح منافذ UDP `50000-60000`
2. تحقق من إعدادات Firewall
3. تأكد من أن المتصفح لديه صلاحيات الكاميرا والميكروفون

## 🤝 المساهمة

نرحب بالمساهمات! يرجى:
1. عمل Fork للمشروع
2. إنشاء Branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للـ Branch (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## 📄 الترخيص

هذا المشروع مفتوح المصدر ومتاح للاستخدام الحر.
