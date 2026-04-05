const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function createAdminUser() {
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

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // إضافة مستخدم admin في جدول users
    const result = await client.query(`
      INSERT INTO users (id, name, username, password, email, role, "isActive")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, 'admin', true)
      ON CONFLICT (username) DO UPDATE SET role = 'admin'
      RETURNING id, name, username, role;
    `, ['المسؤول الرئيسي', 'admin', hashedPassword, 'admin@arabicmeet.com']);

    if (result.rows.length > 0) {
      console.log('✅ تم إنشاء/تحديث المسؤول بنجاح!');
      console.log('   ID:', result.rows[0].id);
      console.log('   Name:', result.rows[0].name);
      console.log('   Username:', result.rows[0].username);
      console.log('   Role:', result.rows[0].role);
      console.log('\n📝 معلومات تسجيل الدخول:');
      console.log('   اسم المستخدم: admin');
      console.log('   كلمة المرور: admin123');
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createAdminUser();
