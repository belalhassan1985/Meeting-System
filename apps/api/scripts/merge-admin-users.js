const { Client } = require('pg');
require('dotenv').config();

async function mergeAdminUsers() {
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

    // 1. إضافة عمود role إلى جدول users
    console.log('📝 إضافة عمود role...');
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'role'
        ) THEN
          ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
        END IF;
      END $$;
    `);
    console.log('✅ تم إضافة عمود role\n');

    // 2. نسخ المسؤولين من جدول admins إلى users
    console.log('📝 نسخ المسؤولين من جدول admins...');
    
    const adminsResult = await client.query('SELECT * FROM admins');
    console.log(`   وجدت ${adminsResult.rows.length} مسؤول\n`);

    for (const admin of adminsResult.rows) {
      // التحقق من عدم وجود username مكرر
      const existingUser = await client.query(
        'SELECT id FROM users WHERE username = $1',
        [admin.username]
      );

      if (existingUser.rows.length > 0) {
        console.log(`   ⚠️  المسؤول ${admin.username} موجود بالفعل في جدول users`);
        // تحديث role إلى admin
        await client.query(
          'UPDATE users SET role = $1 WHERE username = $2',
          ['admin', admin.username]
        );
        console.log(`   ✅ تم تحديث ${admin.username} إلى admin\n`);
      } else {
        // إدراج المسؤول في جدول users
        await client.query(
          `INSERT INTO users (id, name, username, password, email, role, "isActive", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            admin.id,
            admin.fullName || admin.username,
            admin.username,
            admin.password,
            null,
            'admin',
            admin.isActive,
            admin.createdAt,
            admin.updatedAt || admin.createdAt,
          ]
        );
        console.log(`   ✅ تم نسخ المسؤول: ${admin.username}\n`);
      }
    }

    // 3. عرض النتائج النهائية
    console.log('📊 النتائج النهائية:\n');
    
    const usersResult = await client.query(`
      SELECT username, name, role, "isActive" 
      FROM users 
      ORDER BY role DESC, username
    `);

    console.log('┌─────────────────────────────────────────────────────┐');
    console.log('│ Username          │ Name              │ Role  │ نشط │');
    console.log('├─────────────────────────────────────────────────────┤');
    
    for (const user of usersResult.rows) {
      const username = user.username.padEnd(17).substring(0, 17);
      const name = user.name.padEnd(17).substring(0, 17);
      const role = user.role.padEnd(5);
      const active = user.isActive ? '✓' : '✗';
      console.log(`│ ${username} │ ${name} │ ${role} │  ${active}  │`);
    }
    
    console.log('└─────────────────────────────────────────────────────┘\n');

    console.log('✅ تم دمج الجداول بنجاح!');
    console.log('\n⚠️  ملاحظة: جدول admins لا يزال موجوداً.');
    console.log('   يمكنك حذفه يدوياً بعد التأكد من أن كل شيء يعمل:\n');
    console.log('   DROP TABLE admins;\n');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

mergeAdminUsers();
