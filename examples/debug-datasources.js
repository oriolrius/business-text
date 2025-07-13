/**
 * Data Source Debugging Helper
 * 
 * Use this code in the "After Content Ready" section to debug
 * data source connection issues and find available data sources.
 */

// First, let's see what data sources are available
console.log('=== DATA SOURCE DEBUGGING ===');

try {
  const dataSources = context.dataSource.getAvailable();
  console.log('Available data sources:', dataSources);
  
  if (dataSources.length === 0) {
    context.notify.warning('No data sources found. Make sure you have data sources configured in Grafana.');
    document.body.innerHTML = '<h3>⚠️ No data sources configured</h3>';
    return;
  }
  
  // Display available data sources in the panel
  const dataSourceList = dataSources.map(ds => 
    `<li><strong>${ds.name}</strong><br>
     UID: <code>${ds.uid}</code><br>
     Type: <code>${ds.type}</code></li>`
  ).join('');
  
  document.body.innerHTML = `
    <h3>📊 Available Data Sources</h3>
    <ul>${dataSourceList}</ul>
    <p><small>Copy the UID from above to use in your queries</small></p>
  `;
  
  // Test a simple query with the first data source
  if (dataSources.length > 0) {
    const firstDS = dataSources[0];
    console.log(`Testing query with data source: ${firstDS.name} (${firstDS.uid})`);
    
    try {
      // Try a simple query based on data source type
      let result;
      
      if (firstDS.type === 'postgres' || firstDS.type === 'mysql') {
        // For SQL data sources, try a simple query
        result = await context.dataSource.sql(firstDS.uid, 'SELECT 1 as test');
      } else if (firstDS.type === 'influxdb') {
        // For InfluxDB, try a simple query
        result = await context.dataSource.influx(firstDS.uid, 'SHOW DATABASES LIMIT 1');
      } else {
        // For other data sources, try a generic query
        result = await context.dataSource.query(firstDS.uid, { 
          refId: 'A',
          queryType: 'timeSeriesQuery' // Adjust based on your data source
        });
      }
      
      console.log('Query result:', result);
      context.notify.success(`✅ Successfully queried ${firstDS.name}`);
      
      // Append result info
      document.body.innerHTML += `
        <h4>✅ Test Query Result</h4>
        <p>Successfully queried <strong>${firstDS.name}</strong></p>
        <pre>${JSON.stringify(result, null, 2)}</pre>
      `;
      
    } catch (queryError) {
      console.error('Query failed:', queryError);
      context.notify.error(`❌ Query failed: ${queryError.message}`);
      
      document.body.innerHTML += `
        <h4>❌ Test Query Failed</h4>
        <p>Error: <code>${queryError.message}</code></p>
        <p>Check the browser console for more details.</p>
      `;
    }
  }
  
} catch (error) {
  console.error('Data source debugging failed:', error);
  context.notify.error('Failed to access data sources: ' + error.message);
  
  document.body.innerHTML = `
    <h3>❌ Data Source Access Failed</h3>
    <p>Error: <code>${error.message}</code></p>
    <p>Make sure data source queries are enabled in panel options.</p>
  `;
}
