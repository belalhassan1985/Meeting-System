const fetch = require('node-fetch');

async function testAPILogin() {
  const API_URL = 'http://localhost:3001';
  
  console.log('🔍 اختبار تسجيل الدخول عبر API\n');
  
  const testCases = [
    { username: 'testuser', password: '123456' },
    { username: 'علي', password: '123456' },
  ];

  for (const testCase of testCases) {
    console.log(`📝 محاولة تسجيل الدخول:`);
    console.log(`   Username: ${testCase.username}`);
    console.log(`   Password: ${testCase.password}`);

    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase),
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);

      const data = await response.json();

      if (response.ok) {
        console.log('   ✅ نجح!');
        console.log(`   Token: ${data.token.substring(0, 20)}...`);
        console.log(`   User: ${data.user.name}\n`);
      } else {
        console.log('   ❌ فشل!');
        console.log(`   Error: ${JSON.stringify(data)}\n`);
      }
    } catch (error) {
      console.log('   ❌ خطأ في الاتصال:', error.message);
      console.log('   ⚠️  تأكد من أن Backend يعمل على port 3001\n');
    }
  }
}

testAPILogin();
