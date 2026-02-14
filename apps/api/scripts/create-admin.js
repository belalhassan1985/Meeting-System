const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function createAdminTable() {
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

    // إنشاء جدول admins
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        "fullName" VARCHAR(255) NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ تم إنشاء جدول admins');

    // إنشاء فهرس
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
    `);
    console.log('✅ تم إنشاء الفهرس');

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // إضافة أول مسؤول
    const result = await client.query(`
      INSERT INTO admins (username, password, "fullName", "isActive")
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username, "fullName";
    `, ['admin', hashedPassword, 'المسؤول الرئيسي', true]);

    if (result.rows.length > 0) {
      console.log('✅ تم إنشاء المسؤول الأول بنجاح!');
      console.log('   ID:', result.rows[0].id);
      console.log('   Username:', result.rows[0].username);
      console.log('   Full Name:', result.rows[0].fullName);
      console.log('\n📝 معلومات تسجيل الدخول:');
      console.log('   اسم المستخدم: admin');
      console.log('   كلمة المرور: admin123');
      console.log('\n🌐 افتح: http://localhost:3000/admin/login');
    } else {
      console.log('⚠️  المسؤول موجود مسبقاً');
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createAdminTable();
