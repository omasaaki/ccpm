const axios = require('axios');

const API_URL = 'http://localhost:3001/api/v1';
let token = '';

async function login() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    token = response.data.data.tokens.accessToken;
    console.log('✅ Login successful');
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
  }
}

async function testSearch() {
  const tests = [
    { search: '', expected: 'all projects' },
    { search: '新機能', expected: 'projects with 新機能' },
    { search: 'プロジェクト', expected: 'projects with プロジェクト' },
    { search: '存在しない', expected: 'no projects' }
  ];

  for (const test of tests) {
    try {
      const response = await axios.get(`${API_URL}/projects`, {
        params: { search: test.search },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`\n🔍 Search: "${test.search}" (${test.expected})`);
      console.log(`Found: ${response.data.data.data.length} projects`);
      response.data.data.data.forEach(p => {
        console.log(`  - ${p.name}`);
      });
    } catch (error) {
      console.error(`❌ Search failed for "${test.search}":`, error.response?.data || error.message);
    }
  }
}

async function main() {
  await login();
  if (token) {
    await testSearch();
  }
}

main();