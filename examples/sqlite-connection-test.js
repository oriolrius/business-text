// Simple SQLite test using context.dataSource.sql()
const sqliteDataSourceUid = 'sqlite-demo'; // Update with your datasource UID

async function testSQLite() {
  try {
    // Execute query
    const result = await context.dataSource.sql(sqliteDataSourceUid, 'SELECT * FROM devices LIMIT 5');
    
    // Convert to objects
    const rows = context.dataSource.utils.toObjects(result);
    
    // Display results
    document.getElementById('content').innerHTML = `
      <h3>✅ SQLite Connected! Found ${rows.length} devices</h3>
      <pre>${JSON.stringify(rows, null, 2)}</pre>
    `;
    
  } catch (error) {
    document.getElementById('content').innerHTML = `
      <h3>❌ Error: ${error.message}</h3>
    `;
  }
}

testSQLite();