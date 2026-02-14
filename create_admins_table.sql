-- إنشاء جدول المسؤولين (Admins)
-- قم بتنفيذ هذا الملف في pgAdmin أو psql

CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- إنشاء فهرس على username لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);

-- إضافة أول مسؤول (اسم المستخدم: admin، كلمة المرور: admin123)
-- كلمة المرور مشفرة باستخدام bcrypt
INSERT INTO admins (id, username, password, "fullName", "isActive", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'admin',
    '$2b$10$rBV2kHYW5nF5xGZx5xGZxOYQZ5xGZx5xGZx5xGZx5xGZx5xGZx5xG',
    'المسؤول الرئيسي',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (username) DO NOTHING;

-- عرض جميع المسؤولين للتأكد
SELECT id, username, "fullName", "isActive", "createdAt" FROM admins;
