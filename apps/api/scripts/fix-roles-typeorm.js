const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'arabicmeet',
  password: process.env.DATABASE_PASSWORD || 'changeme123',
  database: process.env.DATABASE_NAME || 'arabicmeet',
  entities: [],
  synchronize: false,
});

async function fixRoles() {
  try {
    await AppDataSource.initialize();
    console.log('✅ متصل بقاعدة البيانات\n');

    // Show current state
    console.log('📋 الحالة الحالية:\n');
    const current = await AppDataSource.query('SELECT id, name, username, role FROM users ORDER BY "createdAt" DESC');
    current.forEach(user => {
      console.log(`- ${user.name} (@${user.username}): role = ${user.role || 'NULL'}`);
    });

    // Update admin
    console.log('\n🔧 تحديث الأدوار...\n');
    await AppDataSource.query(`UPDATE users SET role = 'admin' WHERE username = 'admin'`);
    console.log('✅ تم تحديث admin');

    // Update other users
    const result = await AppDataSource.query(`UPDATE users SET role = 'user' WHERE username != 'admin' RETURNING name, username`);
    console.log(`✅ تم تحديث ${result.length} مستخدم إلى role = user`);

    // Show final state
    console.log('\n📋 الحالة النهائية:\n');
    const final = await AppDataSource.query('SELECT id, name, username, role FROM users ORDER BY "createdAt" DESC');
    final.forEach(user => {
      const emoji = user.role === 'admin' ? '👨‍💼' : '👤';
      console.log(`${emoji} ${user.name} (@${user.username}): ${user.role}`);
    });

    console.log('\n✅ تم التحديث بنجاح!');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await AppDataSource.destroy();
  }
}

fixRoles();
