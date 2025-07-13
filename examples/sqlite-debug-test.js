// SQLite Debug Test - Check datasource configuration
const sqliteDataSourceUid = 'sqlite-demo'; // Update with your datasource UID

async function debugSQLite() {
  const container = document.getElementById('content');
  
  try {
    console.log('Starting SQLite debug test...');
    console.log('Available context properties:', Object.keys(context));
    console.log('DataSource methods:', context.dataSource ? Object.keys(context.dataSource) : 'Not available');
    
    // Test 1: Check if datasource exists
    container.innerHTML = '<h3>Testing SQLite connection...</h3>';
    
    // Log the datasource UID we're using
    console.log('Using datasource UID:', sqliteDataSourceUid);
    
    // Try the query
    console.log('Executing query: SELECT * FROM devices LIMIT 5');
    const result = await context.dataSource.sql(sqliteDataSourceUid, 'SELECT * FROM devices LIMIT 5');
    
    console.log('Raw query result:', result);
    console.log('Result type:', typeof result);
    console.log('Result keys:', result ? Object.keys(result) : 'null/undefined');
    
    // Check if result has the expected structure
    if (result && result.series) {
      console.log('Series length:', result.series.length);
      console.log('First series:', result.series[0]);
    }
    
    // Try to convert to objects
    const rows = context.dataSource.utils.toObjects(result);
    console.log('Converted rows:', rows);
    console.log('Number of rows:', rows.length);
    
    if (rows.length === 0) {
      // Try a simpler query
      console.log('No rows returned. Trying COUNT query...');
      const countResult = await context.dataSource.sql(sqliteDataSourceUid, 'SELECT COUNT(*) as total FROM devices');
      const countRows = context.dataSource.utils.toObjects(countResult);
      console.log('Count result:', countRows);
      
      container.innerHTML = `
        <h3>⚠️ Query returned no rows</h3>
        <p>COUNT(*) result: ${JSON.stringify(countRows)}</p>
        <p>Check browser console for detailed debug info</p>
      `;
    } else {
      // Display results
      container.innerHTML = `
        <h3>✅ SQLite Connected! Found ${rows.length} devices</h3>
        <pre>${JSON.stringify(rows, null, 2)}</pre>
      `;
    }
    
  } catch (error) {
    console.error('SQLite query error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      data: error.data,
      status: error.status,
      statusText: error.statusText
    });
    
    container.innerHTML = `
      <h3>❌ Error: ${error.message}</h3>
      <div style="margin-top: 10px; padding: 10px; background: #f8d7da; border-radius: 5px;">
        <h4>Possible issues:</h4>
        <ol>
          <li>SQLite datasource UID might be incorrect (current: "${sqliteDataSourceUid}")</li>
          <li>SQLite datasource might not be properly configured</li>
          <li>Database file might not exist at /tmp/devices.db</li>
          <li>Table 'devices' might not exist in the database</li>
        </ol>
        <p><strong>Check browser console (F12) for detailed debug information</strong></p>
      </div>
    `;
  }
}

// Also test if we can access the data from the panel's query
if (typeof data !== 'undefined' && data) {
  console.log('Panel data object:', data);
  console.log('Panel data series:', data.series);
}

debugSQLite();