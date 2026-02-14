const { Client } = require('pg');
require('dotenv').config();

async function checkUsers() {
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

    const result = await client.query(`
      SELECT id, name, username, email, "isActive", password IS NOT NULL as has_password
      FROM users
      ORDER BY "createdAt" DESC
    `);

    console.log('📋 المستخدمون في النظام:\n');
    console.log('ID | الاسم | Username | Email | نشط | لديه Password');
    console.log('─'.repeat(80));
    
    result.rows.forEach(user => {
      console.log(`${user.id.substring(0, 8)}... | ${user.name} | ${user.username || 'NULL'} | ${user.email || 'NULL'} | ${user.isActive ? '✓' : '✗'} | ${user.has_password ? '✓' : '✗'}`);
    });

    console.log('\n📊 الإحصائيات:');
    console.log(`   - إجمالي المستخدمين: ${result.rows.length}`);
    console.log(`   - لديهم username: ${result.rows.filter(u => u.username).length}`);
    console.log(`   - لديهم password: ${result.rows.filter(u => u.has_password).length}`);
    console.log(`   - نشطون: ${result.rows.filter(u => u.isActive).length}`);

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkUsers();
