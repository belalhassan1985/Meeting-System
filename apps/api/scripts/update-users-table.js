const { Client } = require('pg');
require('dotenv').config();

async function updateUsersTable() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'arabicmeet',
    user: process.env.DATABASE_USER || 'arabicmeet',
    password: process.env.DATABASE_PASSWORD || 'changeme123',
  });

  try {
    await client.connect();
    console.log('✅ متصل بقاعدة البيانات');

    // إضافة الحقول الجديدة
    console.log('📝 إضافة حقول المصادقة لجدول users...');
    
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE,
      ADD COLUMN IF NOT EXISTS password VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    console.log('✅ تم تحديث جدول users بنجاح');

    // تحديث المستخدمين الموجودين (إن وجدوا)
    const result = await client.query('SELECT COUNT(*) FROM users');
    const count = parseInt(result.rows[0].count);

    if (count > 0) {
      console.log(`⚠️  يوجد ${count} مستخدم في الجدول`);
      console.log('⚠️  يجب تحديث بياناتهم يدوياً لإضافة username وpassword');
    } else {
      console.log('✅ لا يوجد مستخدمين في الجدول');
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

updateUsersTable();
