# Script لإنشاء جدول admins وإضافة أول مسؤول
# تأكد من تشغيل PostgreSQL أولاً

Write-Host "=== إعداد جدول المسؤولين ===" -ForegroundColor Green

# معلومات الاتصال بقاعدة البيانات
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "arabic_meet"
$DB_USER = "postgres"
$DB_PASSWORD = "postgres"

# تثبيت المكتبات المطلوبة أولاً
Write-Host "`n1. تثبيت المكتبات المطلوبة..." -ForegroundColor Yellow
Set-Location "d:\live_app\apps\api"
npm install bcrypt jsonwebtoken
npm install --save-dev @types/bcrypt @types/jsonwebtoken

Write-Host "`n2. إنشاء جدول admins في قاعدة البيانات..." -ForegroundColor Yellow

# إنشاء ملف SQL مؤقت
$sqlContent = @"
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);

SELECT 'Table admins created successfully' as status;
"@

$sqlContent | Out-File -FilePath "temp_create_table.sql" -Encoding UTF8

# تنفيذ SQL
$env:PGPASSWORD = $DB_PASSWORD
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f temp_create_table.sql

Remove-Item "temp_create_table.sql"

Write-Host "`n3. إنشاء أول مسؤول..." -ForegroundColor Yellow
Write-Host "   اسم المستخدم: admin" -ForegroundColor Cyan
Write-Host "   كلمة المرور: admin123" -ForegroundColor Cyan

# انتظر Backend أن يكون جاهزاً
Write-Host "`n4. تأكد من تشغيل Backend على http://localhost:3001" -ForegroundColor Yellow
Write-Host "   ثم اضغط Enter للمتابعة..." -ForegroundColor Yellow
Read-Host

# إنشاء أول مسؤول عبر API
try {
    $body = @{
        username = "admin"
        password = "admin123"
        fullName = "المسؤول الرئيسي"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3001/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body

    Write-Host "`n✅ تم إنشاء المسؤول بنجاح!" -ForegroundColor Green
    Write-Host "   ID: $($response.id)" -ForegroundColor Cyan
    Write-Host "   Username: $($response.username)" -ForegroundColor Cyan
    Write-Host "   Full Name: $($response.fullName)" -ForegroundColor Cyan
}
catch {
    Write-Host "`n⚠️ فشل إنشاء المسؤول عبر API" -ForegroundColor Red
    Write-Host "   الخطأ: $_" -ForegroundColor Red
    Write-Host "`n   يمكنك إنشاء المسؤول يدوياً عبر:" -ForegroundColor Yellow
    Write-Host "   curl -X POST http://localhost:3001/auth/register -H 'Content-Type: application/json' -d '{`"username`":`"admin`",`"password`":`"admin123`",`"fullName`":`"المسؤول الرئيسي`"}'" -ForegroundColor Cyan
}

Write-Host "`n=== الإعداد اكتمل! ===" -ForegroundColor Green
Write-Host "`nيمكنك الآن:" -ForegroundColor Yellow
Write-Host "1. فتح http://localhost:3000/admin/login" -ForegroundColor Cyan
Write-Host "2. تسجيل الدخول باستخدام:" -ForegroundColor Cyan
Write-Host "   - اسم المستخدم: admin" -ForegroundColor White
Write-Host "   - كلمة المرور: admin123" -ForegroundColor White
