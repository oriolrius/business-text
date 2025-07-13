// Working SQLite solution for Business Text panel
const sqliteDataSourceUid = 'sqlite-demo';

// Custom SQL function that works with SQLite datasource
async function sqliteQuery(query) {
  try {
    // Use the context.grafana.api to make a direct query request
    const response = await fetch('/api/ds/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        queries: [{
          datasource: {
            type: 'frser-sqlite-datasource',
            uid: sqliteDataSourceUid
          },
          queryText: query,
          rawQueryText: query,
          queryType: 'table',
          refId: 'A',
          format: 'table'
        }],
        from: (Date.now() - 3600000).toString(), // 1 hour ago
        to: Date.now().toString()
      })
    });
    
    const result = await response.json();
    console.log('Query result:', result);
    
    if (result.results && result.results.A && result.results.A.frames) {
      const frame = result.results.A.frames[0];
      
      // Convert frame data to array of objects
      const rows = [];
      const fields = frame.schema.fields;
      const rowCount = frame.data.values[0].length;
      
      for (let i = 0; i < rowCount; i++) {
        const row = {};
        fields.forEach((field, fieldIndex) => {
          row[field.name] = frame.data.values[fieldIndex][i];
        });
        rows.push(row);
      }
      
      return rows;
    }
    
    throw new Error('No data in response');
    
  } catch (error) {
    console.error('SQLite query error:', error);
    throw error;
  }
}

// Test the custom SQLite query function
async function testSQLite() {
  try {
    document.getElementById('content').innerHTML = '<h3>Querying SQLite...</h3>';
    
    // Use our custom query function
    const rows = await sqliteQuery('SELECT * FROM devices LIMIT 5');
    
    document.getElementById('content').innerHTML = `
      <h3>✅ SQLite Connected! Found ${rows.length} devices</h3>
      <pre>${JSON.stringify(rows, null, 2)}</pre>
    `;
    
    // Test other queries
    const count = await sqliteQuery('SELECT COUNT(*) as total FROM devices');
    console.log('Total devices:', count[0].total);
    
  } catch (error) {
    document.getElementById('content').innerHTML = `
      <h3>❌ Error: ${error.message}</h3>
      <p>This might be due to CORS restrictions. Check the browser console.</p>
    `;
  }
}

testSQLite();