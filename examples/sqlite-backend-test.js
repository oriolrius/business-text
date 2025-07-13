/**
 * Simple SQLite Backend Query Test for Business Text Panel
 * This tests SQLite access using context.dataSource.sql()
 */

// Replace with your SQLite datasource UID
const sqliteDataSourceUid = 'sqlite-demo'; // Update this with your actual SQLite datasource UID

async function testSQLiteBackendQuery() {
  const container = document.getElementById('content') || document.querySelector('.panel-content') || document.body;
  
  container.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #1f77b4;">🔌 SQLite Backend Query Test</h2>
      <div id="status">Testing SQLite connection via backend...</div>
      <div id="results" style="margin-top: 20px;"></div>
    </div>
  `;
  
  const statusDiv = document.getElementById('status');
  const resultsDiv = document.getElementById('results');
  
  try {
    // Test 1: Simple SELECT query
    console.log('Executing SQLite query via context.dataSource.sql()...');
    const result = await context.dataSource.sql(sqliteDataSourceUid, 'SELECT * FROM devices LIMIT 5');
    
    console.log('Raw result:', result);
    
    // Convert result to objects
    const rows = context.dataSource.utils.toObjects(result);
    console.log('Converted rows:', rows);
    
    if (rows.length === 0) {
      throw new Error('No data returned from SQLite query');
    }
    
    statusDiv.innerHTML = `
      <div style="color: #28a745; font-weight: bold;">
        ✅ SQLite Backend Query Successful! Found ${rows.length} records
      </div>
    `;
    
    // Display results in a table
    let tableHTML = `
      <h3>Query Results:</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #ddd;">
        <thead>
          <tr style="background-color: #f8f9fa;">
    `;
    
    // Get column headers from first row
    const columns = Object.keys(rows[0]);
    columns.forEach(col => {
      tableHTML += `<th style="padding: 8px; border: 1px solid #ddd; text-align: left;">${col}</th>`;
    });
    
    tableHTML += `</tr></thead><tbody>`;
    
    // Add data rows
    rows.forEach(row => {
      tableHTML += `<tr>`;
      columns.forEach(col => {
        let value = row[col];
        
        // Format timestamps if they look like Unix timestamps
        if (col.includes('_at') && typeof value === 'number' && value > 1000000000000) {
          value = new Date(value).toLocaleString();
        }
        
        tableHTML += `<td style="padding: 8px; border: 1px solid #ddd;">${value !== null ? value : '<em>null</em>'}</td>`;
      });
      tableHTML += `</tr>`;
    });
    
    tableHTML += `</tbody></table>`;
    
    // Test 2: COUNT query
    const countResult = await context.dataSource.sql(sqliteDataSourceUid, 'SELECT COUNT(*) as total FROM devices');
    const countRows = context.dataSource.utils.toObjects(countResult);
    const totalCount = countRows[0]?.total || 0;
    
    // Test 3: GROUP BY query
    const statusResult = await context.dataSource.sql(sqliteDataSourceUid, 
      'SELECT status, COUNT(*) as count FROM devices GROUP BY status'
    );
    const statusRows = context.dataSource.utils.toObjects(statusResult);
    
    let statusHTML = `
      <h3 style="margin-top: 20px;">Status Summary:</h3>
      <div style="background-color: #f8f9fa; padding: 10px; border-radius: 5px;">
        <p><strong>Total devices:</strong> ${totalCount}</p>
        <ul>
    `;
    
    statusRows.forEach(row => {
      statusHTML += `<li>${row.status}: ${row.count} devices</li>`;
    });
    
    statusHTML += `</ul></div>`;
    
    // Additional test queries
    const testQueriesHTML = `
      <div style="margin-top: 20px; padding: 15px; background-color: #e7f3ff; border-radius: 5px;">
        <h4>Test Queries You Can Try:</h4>
        <pre style="background: white; padding: 10px; border-radius: 3px; overflow-x: auto;">
// Get all devices
const result = await context.dataSource.sql('${sqliteDataSourceUid}', 'SELECT * FROM devices');

// Filter by status
const online = await context.dataSource.sql('${sqliteDataSourceUid}', "SELECT * FROM devices WHERE status = 'online'");

// Update a device
await context.dataSource.sql('${sqliteDataSourceUid}', "UPDATE devices SET status = 'maintenance' WHERE id = 1");

// Insert new device
await context.dataSource.sql('${sqliteDataSourceUid}', "INSERT INTO devices (hostname, ip_address, status) VALUES ('new-device', '192.168.1.100', 'online')");

// Delete a device
await context.dataSource.sql('${sqliteDataSourceUid}', "DELETE FROM devices WHERE id = 10");
        </pre>
      </div>
    `;
    
    resultsDiv.innerHTML = tableHTML + statusHTML + testQueriesHTML;
    
  } catch (error) {
    console.error('SQLite query error:', error);
    
    statusDiv.innerHTML = `
      <div style="color: #dc3545; font-weight: bold; padding: 10px; background-color: #f8d7da; border-radius: 5px;">
        ❌ SQLite Query Failed: ${error.message}
      </div>
    `;
    
    resultsDiv.innerHTML = `
      <div style="margin-top: 15px; padding: 15px; background-color: #fff3cd; border-radius: 5px;">
        <h4>Debug Information:</h4>
        <p><strong>Error details:</strong></p>
        <pre style="background: white; padding: 10px; border-radius: 3px; overflow-x: auto;">
${JSON.stringify(error, null, 2)}
        </pre>
        
        <h4 style="margin-top: 15px;">Troubleshooting:</h4>
        <ol>
          <li>Check that SQLite datasource UID is correct: <code>${sqliteDataSourceUid}</code></li>
          <li>Verify SQLite datasource is configured in Grafana</li>
          <li>Ensure database exists: <code>/tmp/devices.db</code></li>
          <li>Check browser console for detailed error messages</li>
        </ol>
        
        <h4 style="margin-top: 15px;">Available context objects:</h4>
        <ul>
          <li>context: ${typeof context !== 'undefined' ? '✓' : '✗'}</li>
          <li>context.dataSource: ${typeof context !== 'undefined' && context.dataSource ? '✓' : '✗'}</li>
          <li>context.dataSource.sql: ${typeof context !== 'undefined' && context.dataSource && context.dataSource.sql ? '✓' : '✗'}</li>
        </ul>
      </div>
    `;
  }
}

// Run the test
testSQLiteBackendQuery();