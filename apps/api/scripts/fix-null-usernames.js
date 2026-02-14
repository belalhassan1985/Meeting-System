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

async function fixNullUsernames() {
  try {
    await AppDataSource.initialize();
    console.log('✅ متصل بقاعدة البيانات\n');

    // Find users with NULL username
    console.log('🔍 البحث عن مستخدمين بدون username...\n');
    const nullUsers = await AppDataSource.query(
      'SELECT id, name, username FROM users WHERE username IS NULL'
    );

    if (nullUsers.length === 0) {
      console.log('✅ جميع المستخدمين لديهم username');
      return;
    }

    console.log(`📋 وجدت ${nullUsers.length} مستخدم بدون username:\n`);
    nullUsers.forEach(user => {
      console.log(`- ${user.name} (ID: ${user.id})`);
    });

    // Update NULL usernames
    console.log('\n🔧 تحديث usernames...\n');
    for (const user of nullUsers) {
      // Generate username from name or use user_ + first 8 chars of ID
      let username = user.name 
        ? user.name.toLowerCase().replace(/\s+/g, '_').substring(0, 20)
        : `user_${user.id.substring(0, 8)}`;
      
      // Make sure it's unique
      const existing = await AppDataSource.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, user.id]
      );
      
      if (existing.length > 0) {
        username = `${username}_${user.id.substring(0, 4)}`;
      }

      await AppDataSource.query(
        'UPDATE users SET username = $1 WHERE id = $2',
        [username, user.id]
      );
      
      console.log(`✅ ${user.name}: username = ${username}`);
    }

    // Show final state
    console.log('\n📋 الحالة النهائية:\n');
    const allUsers = await AppDataSource.query(
      'SELECT id, name, username FROM users ORDER BY "createdAt" DESC'
    );
    
    allUsers.forEach(user => {
      console.log(`- ${user.name} (@${user.username})`);
    });

    console.log('\n✅ تم التحديث بنجاح!');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await AppDataSource.destroy();
  }
}

fixNullUsernames();
