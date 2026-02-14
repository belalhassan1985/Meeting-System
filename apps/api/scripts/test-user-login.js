const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function testUserLogin() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'arabicmeet',
    user: process.env.DATABASE_USER || 'arabicmeet',
    password: process.env.DATABASE_PASSWORD || 'changeme123',
  });

  try {
    await client.connect();
    console.log('✅ متصل بقاعدة البيانات\n');

    // اختبار تسجيل الدخول
    const testUsername = 'testuser';
    const testPassword = '123456';

    console.log(`🔍 محاولة تسجيل الدخول بـ:`);
    console.log(`   Username: ${testUsername}`);
    console.log(`   Password: ${testPassword}\n`);

    // البحث عن المستخدم
    const result = await client.query(
      'SELECT id, name, username, password, "isActive" FROM users WHERE username = $1',
      [testUsername]
    );

    if (result.rows.length === 0) {
      console.log('❌ المستخدم غير موجود في قاعدة البيانات');
      return;
    }

    const user = result.rows[0];
    console.log('✅ المستخدم موجود:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   Has Password: ${user.password ? 'نعم' : 'لا'}\n`);

    if (!user.isActive) {
      console.log('❌ الحساب معطل');
      return;
    }

    // اختبار كلمة المرور
    console.log('🔐 اختبار كلمة المرور...');
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);

    if (isPasswordValid) {
      console.log('✅ كلمة المرور صحيحة!');
      console.log('\n🎉 تسجيل الدخول نجح!');
    } else {
      console.log('❌ كلمة المرور غير صحيحة');
      console.log('\n⚠️  جرب إعادة تعيين كلمة المرور:');
      console.log('   node scripts/reset-user-password.js testuser 123456');
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testUserLogin();
