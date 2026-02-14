const { Client } = require('pg');
require('dotenv').config();

async function createRoomMembersTable() {
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

    // إنشاء جدول room_members
    console.log('📝 إنشاء جدول room_members...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS room_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "roomId" UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "joinedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("roomId", "userId")
      );
    `);
    console.log('✅ تم إنشاء جدول room_members\n');

    // إنشاء indexes للأداء
    console.log('📝 إنشاء indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_room_members_room ON room_members("roomId");
      CREATE INDEX IF NOT EXISTS idx_room_members_user ON room_members("userId");
    `);
    console.log('✅ تم إنشاء indexes\n');

    console.log('✅ تم إنشاء جدول room_members بنجاح!');
    console.log('\n📋 الآن يمكنك:');
    console.log('   1. إضافة مستخدمين للغرف من لوحة الإدارة');
    console.log('   2. المستخدمون سيرون فقط الغرف المسجلين فيها\n');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createRoomMembersTable();
