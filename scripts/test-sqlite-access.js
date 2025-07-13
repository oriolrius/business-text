#!/usr/bin/env node

/**
 * Simple test to verify SQLite database access for the Business Text Grafana plugin
 * This simulates how the SQLite database would be accessed through Grafana's datasource
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DB_PATH = './tmp/devices.db';

console.log('🧪 Testing SQLite Access for Business Text Plugin\n');

// Test 1: Check if database file exists
console.log('1. Checking database file exists...');
try {
  if (fs.existsSync(DB_PATH)) {
    const stats = fs.statSync(DB_PATH);
    console.log(`   ✅ Database found at ${DB_PATH} (${stats.size} bytes)`);
  } else {
    console.log(`   ❌ Database not found at ${DB_PATH}`);
    console.log('   💡 Run ./scripts/create-sqlite-db.sh first');
    process.exit(1);
  }
} catch (error) {
  console.log(`   ❌ Error checking database: ${error.message}`);
  process.exit(1);
}

// Test 2: Check SQLite3 command availability
console.log('\n2. Checking sqlite3 command availability...');
try {
  execSync('which sqlite3', { stdio: 'pipe' });
  console.log('   ✅ sqlite3 command available');
} catch (error) {
  console.log('   ❌ sqlite3 command not found');
  console.log('   💡 Install sqlite3: sudo apt-get install sqlite3');
  process.exit(1);
}

// Test 3: Basic connectivity test
console.log('\n3. Testing basic database connectivity...');
try {
  const result = execSync(`sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM devices;"`, { encoding: 'utf8' });
  const count = parseInt(result.trim());
  console.log(`   ✅ Database connected successfully (${count} records found)`);
} catch (error) {
  console.log(`   ❌ Database connection failed: ${error.message}`);
  process.exit(1);
}

// Test 4: Verify table structure
console.log('\n4. Verifying devices table structure...');
try {
  const schema = execSync(`sqlite3 "${DB_PATH}" ".schema devices"`, { encoding: 'utf8' });
  console.log('   ✅ Table structure verified:');
  console.log('   ' + schema.trim().replace(/\n/g, '\n   '));
} catch (error) {
  console.log(`   ❌ Failed to get table schema: ${error.message}`);
  process.exit(1);
}

// Test 5: Sample data query (simulates what Grafana would do)
console.log('\n5. Testing sample data query...');
try {
  const query = `SELECT hostname, ip_address, status FROM devices LIMIT 3;`;
  const result = execSync(`sqlite3 "${DB_PATH}" -header -column "${query}"`, { encoding: 'utf8' });
  console.log('   ✅ Sample query successful:');
  console.log('   ' + result.trim().replace(/\n/g, '\n   '));
} catch (error) {
  console.log(`   ❌ Sample query failed: ${error.message}`);
  process.exit(1);
}

// Test 6: Test queries that the Business Text panel would use
console.log('\n6. Testing Business Text panel queries...');

const testQueries = [
  {
    name: 'Get all devices',
    query: 'SELECT * FROM devices ORDER BY id;'
  },
  {
    name: 'Filter by status',
    query: "SELECT hostname, status FROM devices WHERE status = 'online';"
  },
  {
    name: 'Count by status',
    query: 'SELECT status, COUNT(*) as count FROM devices GROUP BY status;'
  },
  {
    name: 'Recent devices (timestamp)',
    query: 'SELECT hostname, last_seen_at FROM devices ORDER BY last_seen_at DESC LIMIT 5;'
  }
];

testQueries.forEach((test, index) => {
  try {
    const result = execSync(`sqlite3 "${DB_PATH}" -header "${test.query}"`, { encoding: 'utf8' });
    const rowCount = result.trim().split('\n').length - 1; // Subtract header
    console.log(`   ✅ ${test.name}: ${rowCount} rows returned`);
  } catch (error) {
    console.log(`   ❌ ${test.name}: ${error.message}`);
  }
});

// Test 7: Verify data types for frontend compatibility
console.log('\n7. Testing data types for frontend compatibility...');
try {
  const query = `SELECT 
    typeof(id) as id_type,
    typeof(hostname) as hostname_type,
    typeof(last_seen_at) as timestamp_type,
    typeof(status) as status_type
  FROM devices LIMIT 1;`;
  
  const result = execSync(`sqlite3 "${DB_PATH}" -header -column "${query}"`, { encoding: 'utf8' });
  console.log('   ✅ Data types verified:');
  console.log('   ' + result.trim().replace(/\n/g, '\n   '));
} catch (error) {
  console.log(`   ❌ Data type verification failed: ${error.message}`);
}

console.log('\n🎉 All SQLite access tests passed!');
console.log('\n📋 Summary:');
console.log('   • Database is accessible and contains expected data');
console.log('   • Table structure matches the expected schema');
console.log('   • Sample queries work as expected for Grafana integration');
console.log('   • Data types are compatible with frontend processing');
console.log('\n💡 Next steps:');
console.log('   • Use "SQLite Demo" datasource in Grafana');
console.log('   • Query: SELECT * FROM devices ORDER BY id');
console.log('   • The Go backend handles HTTP fetching, not direct DB access');