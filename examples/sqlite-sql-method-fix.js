// SQLite test with custom SQL implementation
const sqliteDataSourceUid = 'sqlite-demo';

async function testSQLiteWithCustomQuery() {
  try {
    // Look at what context.dataSource.sql might be doing internally
    console.log('Testing custom SQL query implementation...');
    
    // Build the query request matching the working format
    const queryRequest = {
      queries: [{
        datasource: {
          type: 'frser-sqlite-datasource',
          uid: sqliteDataSourceUid
        },
        queryText: 'SELECT * FROM devices LIMIT 5',
        rawQueryText: 'SELECT * FROM devices LIMIT 5',
        queryType: 'table',
        refId: 'A',
        format: 'table',
        timeColumns: ['time', 'ts']
      }]
    };
    
    // Try using the query method directly
    const result = await context.dataSource.request(queryRequest);
    console.log('Direct request result:', result);
    
    if (result && result.data) {
      const rows = context.dataSource.utils.toObjects(result.data);
      document.getElementById('content').innerHTML = `
        <h3>✅ SQLite Connected! Found ${rows.length} devices</h3>
        <pre>${JSON.stringify(rows, null, 2)}</pre>
      `;
    }
    
  } catch (error) {
    console.error('Error:', error);
    
    // Fallback: Try modifying how we call the sql method
    try {
      console.log('Trying fallback approach...');
      
      // Some datasources might need the query in a different format
      // Try passing queryText instead of just the SQL string
      const result2 = await context.dataSource.sql(sqliteDataSourceUid, {
        queryText: 'SELECT * FROM devices LIMIT 5',
        rawQueryText: 'SELECT * FROM devices LIMIT 5'
      });
      
      const rows = context.dataSource.utils.toObjects(result2);
      document.getElementById('content').innerHTML = `
        <h3>✅ SQLite Connected (fallback)! Found ${rows.length} devices</h3>
        <pre>${JSON.stringify(rows, null, 2)}</pre>
      `;
      
    } catch (error2) {
      document.getElementById('content').innerHTML = `
        <h3>❌ Both methods failed</h3>
        <p>Error 1: ${error.message}</p>
        <p>Error 2: ${error2.message}</p>
        <p>The issue is that the SQLite datasource expects 'queryText' but the sql() method sends 'query'</p>
      `;
    }
  }
}

testSQLiteWithCustomQuery();