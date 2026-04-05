# نظام الاجتماعات - Meeting System

نظام اجتماعات فيديو/صوت متكامل يعمل داخل الشبكة المحلية (On-Premise) ويدعم أكثر من 15 مشارك في الغرفة الواحدة.

## المميزات الرئيسية

### التقنيات المستخدمة
- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: NestJS + TypeScript + Socket.IO
- **Database**: PostgreSQL
- **Video/Audio**: LiveKit (SFU Architecture)
- **TURN/STUN**: coturn
- **State Management**: Zustand
- **Deployment**: Docker Compose

### الخصائص الأساسية
✅ إنشاء غرف اجتماعات غير محدودة  
✅ دعم 15+ مشارك في الغرفة الواحدة  
✅ فيديو وصوت عالي الجودة (SFU Architecture)  
✅ مشاركة الشاشة  
✅ محادثة نصية داخل الغرفة  
✅ رفع اليد للتحدث  
✅ واجهة عربية كاملة (RTL)  
✅ دعم الوضع الليلي/النهاري  

### صلاحيات المضيف (Host)
- كتم صوت أي مشارك (Force Mute)
- إيقاف كاميرا أي مشارك (Force Camera Off)
- طرد مشارك من الغرفة
- قفل الغرفة ومنع دخول مشاركين جدد
- ترقية مشارك إلى مساعد مضيف (Co-host)
- سجلات تدقيق كاملة (Audit Logs)

## البنية المعمارية

```
┌─────────────────────────────────────────────────────────┐
│                    Nginx (Reverse Proxy)                │
│                    Port 80/443                          │
└────────────┬──────────────────────────┬─────────────────┘
             │                          │
    ┌────────▼────────┐        ┌───────▼────────┐
    │   Next.js Web   │        │   NestJS API   │
    │   Port 3000     │        │   Port 3001    │
    └─────────────────┘        └────────┬───────┘
                                        │
                    ┌───────────────────┼───────────────┐
                    │                   │               │
           ┌────────▼────────┐  ┌──────▼──────┐  ┌────▼─────┐
           │ LiveKit Server  │  │  PostgreSQL │  │  Redis   │
           │ Port 7880       │  │  Port 5432  │  │          │
           └─────────────────┘  └─────────────┘  └──────────┘
                    │
           ┌────────▼────────┐
           │     coturn      │
           │  TURN/STUN      │
           │  Port 3478      │
           └─────────────────┘
```

## التثبيت والتشغيل

### المتطلبات الأساسية
- Docker و Docker Compose
- Node.js 20+ (للتطوير المحلي فقط)
- 4GB RAM على الأقل
- شبكة محلية (LAN)

### خطوات التشغيل السريع

#### 1. استنساخ المشروع
```bash
git clone <repository-url>
cd live_app
```

#### 2. إعداد ملفات البيئة

**للـ Backend (apps/api/.env):**
```bash
cp apps/api/.env.example apps/api/.env
```

قم بتعديل القيم التالية في `apps/api/.env`:
```env
PORT=3001
NODE_ENV=production

DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=arabicmeet
DATABASE_PASSWORD=YOUR_SECURE_PASSWORD_HERE
DATABASE_NAME=arabicmeet

LIVEKIT_API_KEY=YOUR_LIVEKIT_KEY
LIVEKIT_API_SECRET=YOUR_LIVEKIT_SECRET
LIVEKIT_URL=ws://livekit:7880

JWT_SECRET=YOUR_SUPER_SECRET_JWT_KEY_HERE

CORS_ORIGIN=http://YOUR_SERVER_IP:3000
```

**للـ Frontend (apps/web/.env.local):**
```bash
cp apps/web/.env.local.example apps/web/.env.local
```

قم بتعديل:
```env
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:3001
NEXT_PUBLIC_LIVEKIT_URL=ws://YOUR_SERVER_IP:7880
```

#### 3. تشغيل النظام بالكامل

```bash
cd infra
docker-compose up -d
```

#### 4. التحقق من التشغيل

```bash
# التحقق من حالة الخدمات
docker-compose ps

# عرض السجلات
docker-compose logs -f
```

#### 5. الوصول للنظام

افتح المتصفح وانتقل إلى:
```
http://YOUR_SERVER_IP
```

أو عبر Nginx:
```
http://YOUR_SERVER_IP:80
```

### إيقاف النظام

```bash
cd infra
docker-compose down
```

### إيقاف وحذف البيانات

```bash
cd infra
docker-compose down -v
```

## التطوير المحلي

### 1. تثبيت الحزم

```bash
# في المجلد الرئيسي
npm install

# تثبيت حزم الـ shared package
cd packages/shared
npm install
npm run build

# تثبيت حزم الـ API
cd ../../apps/api
npm install

# تثبيت حزم الـ Web
cd ../web
npm install
```

### 2. تشغيل قاعدة البيانات و LiveKit

```bash
cd infra
docker-compose up -d postgres redis livekit coturn
```

### 3. تشغيل Backend

```bash
cd apps/api
cp .env.example .env
# قم بتعديل .env
npm run dev
```

### 4. تشغيل Frontend

```bash
cd apps/web
cp .env.local.example .env.local
# قم بتعديل .env.local
npm run dev
```

الآن يمكنك الوصول إلى:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- LiveKit: ws://localhost:7880

## هيكل المشروع

```
live_app/
├── apps/
│   ├── api/                 # NestJS Backend
│   │   ├── src/
│   │   │   ├── controllers/ # REST Controllers
│   │   │   ├── services/    # Business Logic
│   │   │   ├── gateways/    # WebSocket Gateways
│   │   │   ├── entities/    # Database Entities
│   │   │   └── config/      # Configuration
│   │   └── package.json
│   │
│   └── web/                 # Next.js Frontend
│       ├── src/
│       │   ├── app/         # App Router Pages
│       │   ├── components/  # React Components
│       │   ├── lib/         # Utilities
│       │   └── store/       # State Management
│       └── package.json
│
├── packages/
│   └── shared/              # Shared Types & Validation
│       ├── src/
│       │   ├── types.ts
│       │   └── validation.ts
│       └── package.json
│
├── infra/                   # Infrastructure
│   ├── docker-compose.yml   # Docker Compose Config
│   ├── Dockerfile.api       # API Dockerfile
│   ├── Dockerfile.web       # Web Dockerfile
│   ├── livekit.yaml         # LiveKit Config
│   ├── coturn.conf          # TURN Server Config
│   └── nginx.conf           # Nginx Config
│
└── README.md
```

## الإعدادات المتقدمة

### تخصيص LiveKit

قم بتعديل `infra/livekit.yaml`:

```yaml
room:
  max_participants: 50      # الحد الأقصى للمشاركين
  empty_timeout: 300        # مهلة الغرفة الفارغة (ثانية)

rtc:
  port_range_start: 50000   # بداية نطاق البورتات
  port_range_end: 60000     # نهاية نطاق البورتات
```

### تخصيص coturn

قم بتعديل `infra/coturn.conf`:

```conf
# تغيير بيانات المصادقة
user=YOUR_USERNAME:YOUR_PASSWORD

# تغيير الـ IP الخارجي
external-ip=YOUR_SERVER_IP
```

### إعداد HTTPS/TLS

1. احصل على شهادة SSL (يمكن استخدام شهادة داخلية)
2. قم بتعديل `infra/nginx.conf` لإضافة:

```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    # ... باقي الإعدادات
}
```

## استكشاف الأخطاء

### المشكلة: لا يمكن الاتصال بالخادم

**الحل:**
```bash
# تحقق من تشغيل الخدمات
docker-compose ps

# تحقق من السجلات
docker-compose logs api
docker-compose logs web
```

### المشكلة: الفيديو/الصوت لا يعمل

**الحل:**
1. تحقق من تشغيل LiveKit:
```bash
docker-compose logs livekit
```

2. تحقق من إعدادات coturn:
```bash
docker-compose logs coturn
```

3. تأكد من فتح البورتات المطلوبة في الجدار الناري

### المشكلة: خطأ في قاعدة البيانات

**الحل:**
```bash
# إعادة تشغيل PostgreSQL
docker-compose restart postgres

# التحقق من الاتصال
docker-compose exec postgres psql -U arabicmeet -d arabicmeet
```

## البورتات المستخدمة

| الخدمة | البورت | البروتوكول | الوصف |
|--------|--------|------------|-------|
| Nginx | 80 | HTTP | Reverse Proxy |
| Nginx | 443 | HTTPS | Reverse Proxy (SSL) |
| Web | 3000 | HTTP | Next.js Frontend |
| API | 3001 | HTTP/WS | NestJS Backend |
| PostgreSQL | 5432 | TCP | Database |
| LiveKit | 7880 | WS | WebRTC Signaling |
| LiveKit | 7881 | TCP | WebRTC Media |
| LiveKit | 7882 | UDP | WebRTC Media |
| coturn | 3478 | UDP | STUN |
| coturn | 5349 | TCP | TURN (TLS) |
| WebRTC | 50000-60000 | UDP | Media Ports |

## الأمان

### التوصيات الأمنية

1. **تغيير كلمات المرور الافتراضية**
   - قاعدة البيانات
   - LiveKit API Keys
   - JWT Secret
   - coturn credentials

2. **استخدام HTTPS**
   - احصل على شهادة SSL
   - فعّل HTTPS في Nginx

3. **تقييد الوصول**
   - استخدم Firewall لتقييد الوصول
   - السماح فقط بالـ IPs الموثوقة

4. **النسخ الاحتياطي**
   - قم بعمل نسخ احتياطي دوري لقاعدة البيانات
   ```bash
   docker-compose exec postgres pg_dump -U arabicmeet arabicmeet > backup.sql
   ```

## الترخيص

هذا المشروع مفتوح المصدر ومتاح للاستخدام الشخصي والتجاري.

## الدعم

للمساعدة والدعم، يرجى فتح issue في المستودع.

## المساهمة

المساهمات مرحب بها! يرجى:
1. Fork المشروع
2. إنشاء branch للميزة الجديدة
3. Commit التغييرات
4. Push إلى الـ branch
5. فتح Pull Request

---

**تم البناء بـ ❤️ للمجتمع العربي**
