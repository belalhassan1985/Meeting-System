# دليل النشر والتشغيل - Deployment Guide

## نظرة عامة

هذا الدليل يشرح كيفية نشر نظام الاجتماعات داخل شبكة محلية (LAN) باستخدام Docker Compose.

## المتطلبات الأساسية

### الأجهزة (Hardware)
- **CPU**: 4 أنوية على الأقل
- **RAM**: 8GB على الأقل (موصى به 16GB)
- **Storage**: 50GB مساحة حرة
- **Network**: اتصال شبكة محلية مستقر

### البرمجيات (Software)
- Docker Engine 20.10+
- Docker Compose 2.0+
- نظام تشغيل: Linux (Ubuntu 20.04+) أو Windows Server

## خطوات النشر التفصيلية

### 1. تحضير الخادم

#### على Linux (Ubuntu/Debian):
```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# تثبيت Docker Compose
sudo apt install docker-compose-plugin -y

# إضافة المستخدم الحالي لمجموعة docker
sudo usermod -aG docker $USER
newgrp docker

# التحقق من التثبيت
docker --version
docker compose version
```

#### على Windows Server:
1. تثبيت Docker Desktop for Windows
2. تفعيل WSL 2
3. التحقق من التثبيت عبر PowerShell

### 2. تحميل المشروع

```bash
# استنساخ المشروع (أو نقل الملفات)
cd /opt
sudo mkdir arabic-meet
sudo chown $USER:$USER arabic-meet
cd arabic-meet

# نسخ ملفات المشروع هنا
```

### 3. إعداد المتغيرات البيئية

#### Backend Environment (.env)

أنشئ ملف `apps/api/.env`:

```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=arabicmeet
DATABASE_PASSWORD=StrongPassword123!@#
DATABASE_NAME=arabicmeet

# LiveKit Configuration
LIVEKIT_API_KEY=APIKey$(openssl rand -hex 16)
LIVEKIT_API_SECRET=Secret$(openssl rand -hex 32)
LIVEKIT_URL=ws://livekit:7880

# Security
JWT_SECRET=$(openssl rand -hex 64)

# CORS (استبدل بـ IP الخادم)
CORS_ORIGIN=http://192.168.1.100:3000
```

#### Frontend Environment (.env.local)

أنشئ ملف `apps/web/.env.local`:

```bash
# استبدل بـ IP الخادم الفعلي
NEXT_PUBLIC_API_URL=http://192.168.1.100:3001
NEXT_PUBLIC_LIVEKIT_URL=ws://192.168.1.100:7880
```

### 4. تخصيص إعدادات LiveKit

عدّل `infra/livekit.yaml`:

```yaml
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true
  tcp_port: 7881
  udp_port: 7882

redis:
  address: redis:6379

keys:
  # استخدم نفس المفاتيح من .env
  YOUR_API_KEY: YOUR_API_SECRET

room:
  auto_create: true
  empty_timeout: 300
  max_participants: 50

turn:
  enabled: true
  domain: 192.168.1.100  # IP الخادم
  tls_port: 5349
  udp_port: 3478
  external_tls: false

logging:
  level: info
  json: false
```

### 5. تخصيص إعدادات coturn

عدّل `infra/coturn.conf`:

```conf
listening-port=3478
tls-listening-port=5349
listening-ip=0.0.0.0

# استبدل بـ IP الخادم الفعلي
external-ip=192.168.1.100
relay-ip=0.0.0.0

realm=arabicmeet.local
server-name=arabicmeet-turn

lt-cred-mech

# غيّر بيانات المصادقة
user=turnuser:TurnPassword123!@#

max-bps=1000000
bps-capacity=0

fingerprint
no-multicast-peers
no-cli
no-tlsv1
no-tlsv1_1

log-file=/var/log/coturn.log
verbose
no-stdout-log
```

### 6. تحديث Docker Compose

عدّل `infra/docker-compose.yml` لتحديث المتغيرات البيئية:

```yaml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: StrongPassword123!@#  # نفس كلمة المرور من .env
  
  api:
    environment:
      CORS_ORIGIN: http://192.168.1.100:3000  # IP الخادم
  
  web:
    environment:
      NEXT_PUBLIC_API_URL: http://192.168.1.100:3001
      NEXT_PUBLIC_LIVEKIT_URL: ws://192.168.1.100:7880
```

### 7. إعداد الجدار الناري (Firewall)

#### على Linux (UFW):
```bash
# السماح بالبورتات الأساسية
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 7880/tcp
sudo ufw allow 7881/tcp
sudo ufw allow 7882/udp

# TURN/STUN
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp

# WebRTC Media Ports
sudo ufw allow 50000:60000/udp

# تفعيل الجدار الناري
sudo ufw enable
```

#### على Windows Server:
استخدم Windows Firewall لفتح نفس البورتات.

### 8. بناء وتشغيل الحاويات

```bash
cd infra

# بناء الصور
docker compose build

# تشغيل الخدمات
docker compose up -d

# التحقق من الحالة
docker compose ps

# عرض السجلات
docker compose logs -f
```

### 9. التحقق من التشغيل

#### فحص الخدمات:
```bash
# التحقق من PostgreSQL
docker compose exec postgres psql -U arabicmeet -d arabicmeet -c "SELECT version();"

# التحقق من API
curl http://localhost:3001/rooms

# التحقق من LiveKit
curl http://localhost:7880
```

#### الوصول للتطبيق:
افتح المتصفح وانتقل إلى:
```
http://192.168.1.100
```

## الصيانة والمراقبة

### عرض السجلات

```bash
# كل الخدمات
docker compose logs -f

# خدمة محددة
docker compose logs -f api
docker compose logs -f web
docker compose logs -f livekit
```

### إعادة تشغيل خدمة

```bash
docker compose restart api
docker compose restart web
```

### تحديث التطبيق

```bash
# إيقاف الخدمات
docker compose down

# سحب آخر التحديثات
git pull

# إعادة البناء
docker compose build

# التشغيل
docker compose up -d
```

### النسخ الاحتياطي

#### نسخ قاعدة البيانات:
```bash
# إنشاء نسخة احتياطية
docker compose exec postgres pg_dump -U arabicmeet arabicmeet > backup_$(date +%Y%m%d_%H%M%S).sql

# استعادة من نسخة احتياطية
docker compose exec -T postgres psql -U arabicmeet arabicmeet < backup_20240213_120000.sql
```

#### نسخ البيانات الكاملة:
```bash
# نسخ volumes
docker run --rm -v arabicmeet_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

### المراقبة

#### استخدام الموارد:
```bash
# استخدام CPU والذاكرة
docker stats

# مساحة القرص
docker system df
```

#### فحص الصحة:
```bash
# التحقق من صحة الحاويات
docker compose ps

# فحص شبكة Docker
docker network inspect arabicmeet-network
```

## استكشاف الأخطاء الشائعة

### 1. خطأ: Cannot connect to database

**السبب**: PostgreSQL لم يبدأ بشكل صحيح

**الحل**:
```bash
docker compose logs postgres
docker compose restart postgres
```

### 2. خطأ: LiveKit connection failed

**السبب**: إعدادات LiveKit غير صحيحة

**الحل**:
```bash
# التحقق من إعدادات LiveKit
docker compose logs livekit

# التحقق من المفاتيح
cat infra/livekit.yaml
cat apps/api/.env | grep LIVEKIT
```

### 3. خطأ: Video/Audio not working

**السبب**: coturn غير مُعد بشكل صحيح

**الحل**:
```bash
# التحقق من coturn
docker compose logs coturn

# التحقق من البورتات
sudo netstat -tulpn | grep -E '3478|5349'

# إعادة تشغيل coturn
docker compose restart coturn
```

### 4. خطأ: CORS Error

**السبب**: إعدادات CORS غير صحيحة

**الحل**:
```bash
# تحديث CORS_ORIGIN في .env
# إعادة تشغيل API
docker compose restart api
```

### 5. خطأ: Port already in use

**السبب**: البورت مستخدم من خدمة أخرى

**الحل**:
```bash
# معرفة العملية المستخدمة للبورت
sudo lsof -i :3000
sudo lsof -i :3001

# إيقاف العملية أو تغيير البورت في docker-compose.yml
```

## الأمان والأداء

### تحسينات الأمان

1. **تغيير كلمات المرور الافتراضية**
2. **استخدام HTTPS مع شهادة SSL**
3. **تقييد الوصول عبر IP Whitelist**
4. **تفعيل Rate Limiting**
5. **مراقبة السجلات بانتظام**

### تحسينات الأداء

1. **زيادة موارد Docker**:
```bash
# تحرير /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

2. **تحسين PostgreSQL**:
```sql
-- زيادة shared_buffers
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
SELECT pg_reload_conf();
```

3. **تحسين Nginx**:
```nginx
worker_processes auto;
worker_connections 4096;
```

## إعداد HTTPS (اختياري)

### 1. الحصول على شهادة SSL

#### شهادة داخلية (Self-signed):
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout infra/ssl/key.pem \
  -out infra/ssl/cert.pem
```

### 2. تحديث Nginx

عدّل `infra/nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name arabicmeet.local;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... باقي الإعدادات
}

server {
    listen 80;
    return 301 https://$host$request_uri;
}
```

### 3. تحديث Docker Compose

```yaml
nginx:
  volumes:
    - ./ssl:/etc/nginx/ssl:ro
```

## الخلاصة

بعد اتباع هذه الخطوات، سيكون لديك نظام اجتماعات عربي كامل يعمل داخل شبكتك المحلية مع:

✅ دعم 15+ مشارك  
✅ جودة فيديو/صوت عالية  
✅ أمان متقدم  
✅ سهولة الصيانة  
✅ قابلية التوسع  

للدعم الفني، راجع ملف README.md أو افتح issue في المستودع.
