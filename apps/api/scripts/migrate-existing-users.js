const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function migrateExistingUsers() {
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

    // الحصول على المستخدمين الذين ليس لديهم username
    const result = await client.query(`
      SELECT id, name, email 
      FROM users 
      WHERE username IS NULL OR password IS NULL
    `);

    if (result.rows.length === 0) {
      console.log('✅ جميع المستخدمين لديهم بيانات مصادقة');
      return;
    }

    console.log(`📝 تحديث ${result.rows.length} مستخدم...`);

    for (const user of result.rows) {
      // إنشاء username من الاسم (إزالة المسافات)
      let username = user.name.replace(/\s+/g, '').toLowerCase();
      
      // التحقق من أن username فريد
      let counter = 1;
      let finalUsername = username;
      while (true) {
        const check = await client.query(
          'SELECT id FROM users WHERE username = $1 AND id != $2',
          [finalUsername, user.id]
        );
        if (check.rows.length === 0) break;
        finalUsername = `${username}${counter}`;
        counter++;
      }

      // إنشاء كلمة مرور افتراضية
      const defaultPassword = '123456';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      // تحديث المستخدم
      await client.query(
        `UPDATE users 
         SET username = $1, password = $2, "isActive" = true 
         WHERE id = $3`,
        [finalUsername, hashedPassword, user.id]
      );

      console.log(`✅ تم تحديث: ${user.name} → username: ${finalUsername}, password: ${defaultPassword}`);
    }

    console.log('\n🎉 تم تحديث جميع المستخدمين بنجاح!');
    console.log('\n⚠️  ملاحظة مهمة:');
    console.log('   - كلمة المرور الافتراضية لجميع المستخدمين: 123456');
    console.log('   - يُنصح بتغيير كلمات المرور من لوحة إدارة المستخدمين');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrateExistingUsers();
