const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createTestUser() {
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

    // إنشاء مستخدم تجريبي
    const username = 'testuser';
    const password = '123456';
    const name = 'مستخدم تجريبي';
    
    // التحقق من وجود المستخدم
    const existing = await client.query('SELECT id FROM users WHERE username = $1', [username]);
    
    if (existing.rows.length > 0) {
      console.log('⚠️  المستخدم موجود بالفعل');
      console.log(`   Username: ${username}`);
      console.log(`   Password: ${password}`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query(
      `INSERT INTO users (name, username, password, "isActive") 
       VALUES ($1, $2, $3, true)`,
      [name, username, hashedPassword]
    );

    console.log('✅ تم إنشاء مستخدم تجريبي بنجاح!\n');
    console.log('📝 بيانات الدخول:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   الاسم: ${name}`);

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTestUser();
