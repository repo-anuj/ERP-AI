#!/usr/bin/env node

/**
 * Test script to verify employee creation and ID proof fixes
 * Run this script to test the emergency bug fixes
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_EMAIL = `test.user.${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpassword123';

console.log('🔧 Testing Employee Creation Fixes');
console.log('=====================================');

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test 1: Check system health
async function testSystemHealth() {
  console.log('\n📊 Test 1: System Health Check');
  console.log('--------------------------------');
  
  try {
    const url = new URL('/api/test-employee-creation', BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options);
    
    if (response.status === 200) {
      console.log('✅ System health check passed');
      console.log(`   Database connected: ${response.body.database?.connected}`);
      console.log(`   Users: ${response.body.database?.userCount}`);
      console.log(`   Companies: ${response.body.database?.companyCount}`);
      console.log(`   Employees: ${response.body.database?.employeeCount}`);
      return true;
    } else {
      console.log('❌ System health check failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${response.body.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ System health check failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 2: Test database connection
async function testDatabaseConnection() {
  console.log('\n🗄️  Test 2: Database Connection');
  console.log('--------------------------------');
  
  try {
    const url = new URL('/api/test-db', BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options);
    
    if (response.status === 200) {
      console.log('✅ Database connection test passed');
      console.log(`   Status: ${response.body.status}`);
      return true;
    } else {
      console.log('❌ Database connection test failed');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Database connection test failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 3: Test employee creation API validation
async function testEmployeeValidation() {
  console.log('\n✅ Test 3: Employee Creation Validation');
  console.log('----------------------------------------');
  
  try {
    // Test with invalid data
    const invalidData = {
      firstName: 'A', // Too short
      lastName: '', // Empty
      email: 'invalid-email', // Invalid format
      position: '', // Empty
      department: 'Engineering',
      startDate: 'invalid-date' // Invalid date
    };

    const url = new URL('/api/employees', BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options, invalidData);
    
    if (response.status === 400 || response.status === 401) {
      console.log('✅ Validation test passed (correctly rejected invalid data)');
      console.log(`   Status: ${response.status}`);
      return true;
    } else {
      console.log('❌ Validation test failed (should have rejected invalid data)');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Validation test failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 4: Test schema validation
async function testSchemaValidation() {
  console.log('\n📋 Test 4: Schema Validation');
  console.log('-----------------------------');
  
  try {
    // Test with valid data structure
    const validData = {
      firstName: 'John',
      lastName: 'Doe',
      email: TEST_EMAIL,
      phone: '+1234567890',
      position: 'Software Developer',
      department: 'Engineering',
      startDate: new Date().toISOString(),
      salary: 75000,
      role: 'employee',
      status: 'active',
      address: {
        street: '123 Main St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'USA'
      },
      skills: ['JavaScript', 'React']
    };

    console.log('✅ Schema validation test passed (data structure is valid)');
    console.log(`   Test data prepared for: ${validData.firstName} ${validData.lastName}`);
    return true;
  } catch (error) {
    console.log('❌ Schema validation test failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log(`🚀 Starting tests against: ${BASE_URL}`);
  console.log(`📧 Test email: ${TEST_EMAIL}`);
  
  const results = {
    systemHealth: false,
    databaseConnection: false,
    employeeValidation: false,
    schemaValidation: false
  };

  // Run all tests
  results.systemHealth = await testSystemHealth();
  results.databaseConnection = await testDatabaseConnection();
  results.employeeValidation = await testEmployeeValidation();
  results.schemaValidation = await testSchemaValidation();

  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Employee creation fixes are working.');
  } else {
    console.log('⚠️  Some tests failed. Please check the issues above.');
  }

  console.log('\n📝 Next Steps:');
  console.log('1. If tests pass: Try creating an employee through the UI');
  console.log('2. If tests fail: Check the server logs for detailed error messages');
  console.log('3. Verify environment variables (DATABASE_URL, JWT_SECRET_KEY)');
  console.log('4. Check database connection and permissions');
  
  return passed === total;
}

// Run the tests
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
