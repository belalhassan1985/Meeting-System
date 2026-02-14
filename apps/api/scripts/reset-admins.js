const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function resetAdminsTable() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'arabicmeet',
    user: process.env.DATABASE_USER || 'arabicmeet',
    password: process.env.DATABASE_PASSWORD || 'changeme123',
  });

  try {
    await client.connect();
    console.log('✅ متصل بقاعدة البيانات');

    // حذف الجدول القديم
    await client.query('DROP TABLE IF EXISTS admins CASCADE;');
    console.log('✅ تم حذف جدول admins القديم');

    // إنشاء جدول admins جديد
    await client.query(`
      CREATE TABLE admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        "fullName" VARCHAR(255) NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ تم إنشاء جدول admins جديد');

    // إنشاء فهرس
    await client.query(`
      CREATE INDEX idx_admins_username ON admins(username);
    `);
    console.log('✅ تم إنشاء الفهرس');

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // إضافة أول مسؤول
    const result = await client.query(`
      INSERT INTO admins (username, password, "fullName", "isActive")
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, "fullName";
    `, ['admin', hashedPassword, 'المسؤول الرئيسي', true]);

    console.log('✅ تم إنشاء المسؤول الأول بنجاح!');
    console.log('   ID:', result.rows[0].id);
    console.log('   Username:', result.rows[0].username);
    console.log('   Full Name:', result.rows[0].fullName);
    console.log('\n📝 معلومات تسجيل الدخول:');
    console.log('   اسم المستخدم: admin');
    console.log('   كلمة المرور: admin123');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetAdminsTable();
