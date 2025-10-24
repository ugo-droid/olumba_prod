// Comprehensive API endpoint testing for Olumba
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

const endpoints = [
  { name: 'Projects', url: '/api/projects', method: 'GET' },
  { name: 'Tasks', url: '/api/tasks', method: 'GET' },
  { name: 'Documents', url: '/api/documents', method: 'GET' },
  { name: 'Messages', url: '/api/messages', method: 'GET' },
  { name: 'Clients', url: '/api/clients', method: 'GET' },
  { name: 'City Approvals', url: '/api/city-approvals', method: 'GET' },
  { name: 'Notifications', url: '/api/notifications', method: 'GET' },
  { name: 'Project Members', url: '/api/project-members', method: 'GET' },
  { name: 'Search', url: '/api/search', method: 'GET' }
];

async function testEndpoint(endpoint) {
  try {
    console.log(`\n🧪 Testing ${endpoint.name}...`);
    
    const response = await fetch(`${BASE_URL}${endpoint.url}`, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`   ✅ Success: ${data.success ? 'Yes' : 'No'}`);
    console.log(`   📊 Data count: ${Array.isArray(data.data) ? data.data.length : 'N/A'}`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
    return false;
  }
}

async function testAllEndpoints() {
  console.log('🚀 Starting API endpoint tests for Olumba...\n');
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    results.push({ ...endpoint, success });
  }
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed endpoints:');
    failed.forEach(endpoint => {
      console.log(`   - ${endpoint.name} (${endpoint.url})`);
    });
  }
  
  console.log('\n🎯 Overall Status:', failed.length === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');
}

// Run tests
testAllEndpoints().catch(console.error);
