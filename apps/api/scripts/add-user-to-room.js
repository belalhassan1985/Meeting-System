const { Client } = require('pg');
require('dotenv').config();

async function addUserToRoom() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('❌ الاستخدام: node add-user-to-room.js <roomId> <userId>');
    console.log('   أو: node add-user-to-room.js <roomName> <username>');
    console.log('\n   مثال: node add-user-to-room.js "غرفة الاجتماع" testuser');
    process.exit(1);
  }

  const roomIdentifier = args[0];
  const userIdentifier = args[1];

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

    // البحث عن الغرفة
    let room;
    const roomByIdResult = await client.query(
      'SELECT id, name FROM rooms WHERE id = $1',
      [roomIdentifier]
    );

    if (roomByIdResult.rows.length > 0) {
      room = roomByIdResult.rows[0];
    } else {
      const roomByNameResult = await client.query(
        'SELECT id, name FROM rooms WHERE name = $1',
        [roomIdentifier]
      );
      
      if (roomByNameResult.rows.length > 0) {
        room = roomByNameResult.rows[0];
      }
    }

    if (!room) {
      console.log(`❌ الغرفة "${roomIdentifier}" غير موجودة`);
      process.exit(1);
    }

    console.log(`📍 الغرفة: ${room.name} (${room.id})`);

    // البحث عن المستخدم
    let user;
    const userByIdResult = await client.query(
      'SELECT id, name, username FROM users WHERE id = $1',
      [userIdentifier]
    );

    if (userByIdResult.rows.length > 0) {
      user = userByIdResult.rows[0];
    } else {
      const userByUsernameResult = await client.query(
        'SELECT id, name, username FROM users WHERE username = $1',
        [userIdentifier]
      );
      
      if (userByUsernameResult.rows.length > 0) {
        user = userByUsernameResult.rows[0];
      }
    }

    if (!user) {
      console.log(`❌ المستخدم "${userIdentifier}" غير موجود`);
      process.exit(1);
    }

    console.log(`👤 المستخدم: ${user.name} (@${user.username})`);

    // التحقق من العضوية الموجودة
    const existingMember = await client.query(
      'SELECT id FROM room_members WHERE "roomId" = $1 AND "userId" = $2',
      [room.id, user.id]
    );

    if (existingMember.rows.length > 0) {
      console.log('\n⚠️  المستخدم مسجل بالفعل في هذه الغرفة!');
      process.exit(0);
    }

    // إضافة العضو
    await client.query(
      'INSERT INTO room_members ("roomId", "userId") VALUES ($1, $2)',
      [room.id, user.id]
    );

    console.log('\n✅ تم إضافة المستخدم إلى الغرفة بنجاح!');
    console.log(`\n📋 التفاصيل:`);
    console.log(`   الغرفة: ${room.name}`);
    console.log(`   المستخدم: ${user.name} (@${user.username})`);

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addUserToRoom();
