const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function resetUserPassword() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('❌ الاستخدام: node reset-user-password.js <username> <new-password>');
    console.log('   مثال: node reset-user-password.js testuser 123456');
    process.exit(1);
  }

  const username = args[0];
  const newPassword = args[1];

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

    // البحث عن المستخدم
    const result = await client.query(
      'SELECT id, name, username FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      console.log(`❌ المستخدم "${username}" غير موجود`);
      process.exit(1);
    }

    const user = result.rows[0];
    console.log(`📝 المستخدم: ${user.name} (${user.username})`);

    // تشفير كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // تحديث كلمة المرور
    await client.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, user.id]
    );

    console.log(`✅ تم تحديث كلمة المرور بنجاح!`);
    console.log(`\n📝 بيانات الدخول الجديدة:`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${newPassword}`);

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetUserPassword();
