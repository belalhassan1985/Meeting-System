# تشغيل LiveKit - دليل سريع

## ✅ تم تحديث الإعدادات

**IP المحلي لجهازك:** `192.168.100.154`

تم تحديث:
- ✅ `apps/web/.env.local` - للاتصال بالـ API و LiveKit
- ✅ `apps/api/.env` - للسماح بـ CORS من الشبكة المحلية

---

## 🚀 الخطوة 1: تشغيل LiveKit

**في terminal جديد، نفذ:**

```powershell
cd d:\live_app
docker compose -f docker-compose-livekit-only.yml up -d
```

**التحقق من التشغيل:**

```powershell
docker ps
```

يجب أن ترى:
- `arabicmeet-redis` - Running
- `arabicmeet-livekit` - Running

**عرض logs:**

```powershell
docker logs arabicmeet-livekit
```

---

## 🔄 الخطوة 2: إعادة تشغيل Backend و Frontend

**أوقف الـ servers الحالية (Ctrl+C) ثم:**

### Terminal 1 - Backend:
```powershell
cd d:\live_app\apps\api
npm run dev
```

### Terminal 2 - Frontend:
```powershell
cd d:\live_app\apps\web
npm run dev
```

---

## 🌐 الوصول للتطبيق

### من نفس الجهاز:
```
http://localhost:3000
```

### من أجهزة أخرى على نفس الشبكة:
```
http://192.168.100.154:3000
```

**شارك هذا الرابط مع أي شخص على نفس الشبكة المحلية!**

---

## 🔥 إعدادات Firewall (إذا لزم الأمر)

إذا لم يستطع الآخرون الوصول، افتح Windows Firewall:

1. ابحث عن "Windows Defender Firewall"
2. اضغط "Advanced settings"
3. اضغط "Inbound Rules" → "New Rule"
4. اختر "Port" → Next
5. اختر "TCP" وأدخل: `3000,3001,7880`
6. اختر "Allow the connection"
7. اختر جميع الـ profiles (Domain, Private, Public)
8. أعطها اسم: "Arabic Meet Ports"

---

## ✅ اختبار LiveKit

بعد تشغيل LiveKit، افتح:
```
http://localhost:7880
```

يجب أن ترى صفحة LiveKit Server

---

## 🛑 إيقاف LiveKit

```powershell
cd d:\live_app
docker compose -f docker-compose-livekit-only.yml down
```

---

## 📝 ملاحظات

- LiveKit يحتاج Redis للعمل (يتم تشغيله تلقائياً)
- البورتات المستخدمة:
  - 3000: Frontend (Next.js)
  - 3001: Backend (NestJS)
  - 6379: Redis
  - 7880: LiveKit WebSocket
  - 7881: LiveKit TCP
  - 50000-50100: LiveKit RTC (UDP)
