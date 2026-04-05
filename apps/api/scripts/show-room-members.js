const { Client } = require('pg');
require('dotenv').config();

async function showRoomMembers() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('❌ الاستخدام: node show-room-members.js <roomId>');
    console.log('   أو: node show-room-members.js <roomName>');
    console.log('\n   مثال: node show-room-members.js "غرفة الاجتماع"');
    process.exit(1);
  }

  const roomIdentifier = args[0];

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
      'SELECT id, name, description, "isActive" FROM rooms WHERE id = $1',
      [roomIdentifier]
    );

    if (roomByIdResult.rows.length > 0) {
      room = roomByIdResult.rows[0];
    } else {
      const roomByNameResult = await client.query(
        'SELECT id, name, description, "isActive" FROM rooms WHERE name = $1',
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

    console.log(`📍 الغرفة: ${room.name}`);
    if (room.description) {
      console.log(`   الوصف: ${room.description}`);
    }
    console.log(`   الحالة: ${room.isActive ? 'نشطة ✓' : 'مغلقة ✗'}`);
    console.log(`   ID: ${room.id}\n`);

    // الحصول على الأعضاء
    const membersResult = await client.query(
      `SELECT 
        u.id, u.name, u.username, u.email, u.role, 
        rm."joinedAt"
      FROM room_members rm
      JOIN users u ON rm."userId" = u.id
      WHERE rm."roomId" = $1
      ORDER BY rm."joinedAt" DESC`,
      [room.id]
    );

    if (membersResult.rows.length === 0) {
      console.log('⚠️  لا يوجد أعضاء مسجلين في هذه الغرفة');
      process.exit(0);
    }

    console.log(`👥 الأعضاء المسجلين (${membersResult.rows.length}):\n`);
    console.log('┌────────────────────────────────────────────────────────────────────┐');
    console.log('│ الاسم              │ Username       │ Role  │ تاريخ الانضمام      │');
    console.log('├────────────────────────────────────────────────────────────────────┤');

    for (const member of membersResult.rows) {
      const name = member.name.padEnd(18).substring(0, 18);
      const username = member.username.padEnd(14).substring(0, 14);
      const role = member.role.padEnd(5);
      const joinedAt = new Date(member.joinedAt).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).padEnd(20);
      
      console.log(`│ ${name} │ ${username} │ ${role} │ ${joinedAt} │`);
    }

    console.log('└────────────────────────────────────────────────────────────────────┘\n');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

showRoomMembers();
