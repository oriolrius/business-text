// Fixed SQLite test - using proper query structure
const sqliteDataSourceUid = 'sqlite-demo';

async function testSQLite() {
  try {
    console.log('Testing SQLite with correct query structure...');
    
    // Method 1: Try with queryText (matching the working query structure)
    const result = await context.dataSource.query({
      datasource: {
        type: 'frser-sqlite-datasource',
        uid: sqliteDataSourceUid
      },
      queryText: 'SELECT * FROM devices LIMIT 5',
      rawQueryText: 'SELECT * FROM devices LIMIT 5',
      queryType: 'table',
      refId: 'A',
      format: 'table'
    });
    
    console.log('Query result:', result);
    
    // If the above doesn't work, try the sql method with different approaches
    if (!result || !result.data) {
      console.log('First method failed, trying context.dataSource.sql...');
      
      // Method 2: Original sql method but ensure we're passing the right query
      const sqlResult = await context.dataSource.sql(sqliteDataSourceUid, 'SELECT * FROM devices LIMIT 5');
      console.log('SQL method result:', sqlResult);
      
      const rows = context.dataSource.utils.toObjects(sqlResult);
      displayResults(rows);
    } else {
      // Process the query result
      const data = result.data;
      if (data && data.length > 0 && data[0].fields) {
        const rows = context.dataSource.utils.toObjects(data[0]);
        displayResults(rows);
      } else {
        throw new Error('No data in result');
      }
    }
    
  } catch (error) {
    console.error('SQLite error:', error);
    document.getElementById('content').innerHTML = `
      <h3>❌ Error: ${error.message}</h3>
      <pre>Check console for details</pre>
    `;
  }
}

function displayResults(rows) {
  if (rows && rows.length > 0) {
    document.getElementById('content').innerHTML = `
      <h3>✅ SQLite Connected! Found ${rows.length} devices</h3>
      <pre>${JSON.stringify(rows, null, 2)}</pre>
    `;
  } else {
    document.getElementById('content').innerHTML = `
      <h3>⚠️ Query executed but returned no rows</h3>
    `;
  }
}

// Alternative approach: Check how the datasource is configured
async function checkDataSourceConfig() {
  console.log('Checking datasource configuration...');
  console.log('Available context methods:', context.dataSource ? Object.keys(context.dataSource) : 'No dataSource');
  
  // Try to inspect the datasource
  if (context.dataSource.get) {
    try {
      const ds = await context.dataSource.get(sqliteDataSourceUid);
      console.log('Datasource info:', ds);
    } catch (e) {
      console.log('Could not get datasource info:', e);
    }
  }
}

checkDataSourceConfig();
testSQLite();