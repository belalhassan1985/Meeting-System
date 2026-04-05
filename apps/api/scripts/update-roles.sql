-- تحديث دور المسؤول
UPDATE users SET role = 'admin' WHERE username = 'admin';

-- تحديث جميع المستخدمين الآخرين
UPDATE users SET role = 'user' WHERE username != 'admin';

-- عرض النتائج
SELECT id, name, username, role FROM users ORDER BY "createdAt" DESC;
