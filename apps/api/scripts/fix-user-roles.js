const { Client } = require('pg');

const client = new Client({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  user: process.env.DATABASE_USER || 'arabicmeet',
  password: process.env.DATABASE_PASSWORD || 'changeme123',
  database: process.env.DATABASE_NAME || 'arabicmeet',
});

async function fixUserRoles() {
  try {
    await client.connect();
    console.log('✅ متصل بقاعدة البيانات\n');

    // Check current roles
    console.log('📋 الأدوار الحالية:\n');
    const currentRoles = await client.query(`
      SELECT id, name, username, role 
      FROM users 
      ORDER BY "createdAt" DESC
    `);
    
    currentRoles.rows.forEach(user => {
      console.log(`- ${user.name} (@${user.username}): role = ${user.role || 'NULL'}`);
    });

    console.log('\n🔧 تحديث الأدوار...\n');

    // Update admin user
    await client.query(`
      UPDATE users 
      SET role = 'admin' 
      WHERE username = 'admin'
    `);
    console.log('✅ تم تحديث admin إلى role = admin');

    // Update all other users to 'user'
    const result = await client.query(`
      UPDATE users 
      SET role = 'user' 
      WHERE username != 'admin' AND (role IS NULL OR role != 'user')
      RETURNING id, name, username, role
    `);

    if (result.rows.length > 0) {
      console.log(`✅ تم تحديث ${result.rows.length} مستخدم إلى role = user:`);
      result.rows.forEach(user => {
        console.log(`   - ${user.name} (@${user.username})`);
      });
    } else {
      console.log('✅ جميع المستخدمين لديهم role صحيح بالفعل');
    }

    // Show final state
    console.log('\n📋 الأدوار النهائية:\n');
    const finalRoles = await client.query(`
      SELECT id, name, username, role 
      FROM users 
      ORDER BY "createdAt" DESC
    `);
    
    finalRoles.rows.forEach(user => {
      const roleEmoji = user.role === 'admin' ? '👨‍💼' : '👤';
      console.log(`${roleEmoji} ${user.name} (@${user.username}): ${user.role}`);
    });

    console.log('\n✅ تم تحديث جميع الأدوار بنجاح!');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await client.end();
  }
}

fixUserRoles();
