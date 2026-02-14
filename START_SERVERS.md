# 🚀 دليل تشغيل الخوادم

## ⚠️ مهم جداً

قبل تشغيل الخوادم، تأكد من:
1. إيقاف أي عمليات تعمل على المنافذ 3000 و 3001
2. قاعدة البيانات PostgreSQL تعمل
3. تم تثبيت جميع المكتبات

---

## 📋 خطوات التشغيل

### 1. إيقاف جميع العمليات القديمة

في PowerShell، قم بإيقاف أي عمليات على المنافذ:

```powershell
# إيقاف العمليات على المنفذ 3001 (Backend)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force

# إيقاف العمليات على المنفذ 3000 (Frontend)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force
```

أو ببساطة:
```powershell
# إيقاف جميع عمليات Node.js
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

---

### 2. تشغيل Backend

افتح PowerShell جديد:

```powershell
cd d:\live_app\apps\api
npm run dev
```

انتظر حتى ترى:
```
🚀 Arabic Meet API running on: http://localhost:3001
```

---

### 3. تشغيل Frontend

افتح PowerShell جديد آخر:

```powershell
cd d:\live_app\apps\web
npm run dev
```

انتظر حتى ترى:
```
✓ Ready in X.Xs
- Local: http://localhost:3000
```

---

## 🔓 تسجيل الدخول

1. افتح المتصفح: `http://localhost:3000`
2. سيتم توجيهك لصفحة تسجيل الدخول
3. استخدم:
   - **اسم المستخدم**: `admin`
   - **كلمة المرور**: `admin123`

---

## 🛠️ حل المشاكل

### المنفذ مشغول (EADDRINUSE)

```powershell
# للتحقق من العملية التي تستخدم المنفذ
netstat -ano | findstr :3001
netstat -ano | findstr :3000

# ثم إيقاف العملية باستخدام PID
taskkill /PID <رقم_العملية> /F
```

### خطأ في قاعدة البيانات

تأكد من أن PostgreSQL يعمل:
```powershell
docker ps
```

يجب أن ترى `arabicmeet-postgres` في القائمة.

---

## ✅ التحقق من عمل النظام

بعد تشغيل الخوادم:

1. ✅ Backend: `http://localhost:3001` (يجب أن يعمل)
2. ✅ Frontend: `http://localhost:3000` (يجب أن يفتح صفحة تسجيل الدخول)
3. ✅ تسجيل الدخول يعمل بدون أخطاء CORS

---

**النظام جاهز! 🎉**
