/**
 * PostgreSQL Data Source Debugging Script
 * 
 * Use this in "After Content Ready" to debug PostgreSQL query issues
 */

console.log('=== PostgreSQL DEBUGGING START ===');

try {
  // Step 1: Check available data sources
  const dataSources = context.dataSource.getAvailable();
  console.log('Available data sources:', dataSources);
  
  // Find PostgreSQL data source
  const pgDataSource = dataSources.find(ds => 
    ds.type === 'grafana-postgresql-datasource' || 
    ds.name.toLowerCase().includes('postgres')
  );
  
  if (!pgDataSource) {
    context.notify.error('No PostgreSQL data source found');
    document.body.innerHTML = '<h3>❌ No PostgreSQL data source found</h3>';
    return;
  }
  
  console.log('Using PostgreSQL data source:', pgDataSource);
  
  // Step 2: Test simple query
  console.log('Testing simple query...');
  
  const testResult = await context.dataSource.sql(pgDataSource.uid, 'SELECT current_timestamp as now, 1 as test_value');
  
  console.log('Test query result:', testResult);
  console.log('Test result data frames:', testResult?.data?.length);
  
  if (testResult?.data?.[0]) {
    const frame = testResult.data[0];
    console.log('First frame:', {
      name: frame.name,
      length: frame.length,
      fields: frame.fields?.map(f => ({ name: f.name, type: f.type, values: f.values }))
    });
  }
  
  // Step 3: Test your actual query
  console.log('Testing devices query...');
  
  const devicesResult = await context.dataSource.sql(pgDataSource.uid, 'SELECT * FROM devices LIMIT 5');
  
  console.log('Devices query result:', devicesResult);
  
  if (devicesResult?.data?.[0]) {
    const frame = devicesResult.data[0];
    console.log('Devices frame:', {
      name: frame.name,
      length: frame.length,
      fieldCount: frame.fields?.length,
      fields: frame.fields?.map(f => ({ 
        name: f.name, 
        type: f.type, 
        valueCount: f.values?.length,
        firstValue: f.values?.[0]
      }))
    });
    
    // Display results
    if (frame.length > 0) {
      document.body.innerHTML = `
        <h3>✅ Devices Query Successful</h3>
        <p><strong>Rows found:</strong> ${frame.length}</p>
        <p><strong>Columns:</strong> ${frame.fields?.length}</p>
        <h4>Fields:</h4>
        <ul>
          ${frame.fields?.map(f => `<li>${f.name} (${f.type})</li>`).join('')}
        </ul>
        <h4>First Row Data:</h4>
        <pre>${JSON.stringify(
          frame.fields?.reduce((obj, field, i) => {
            obj[field.name] = field.values?.[0];
            return obj;
          }, {}), null, 2
        )}</pre>
      `;
    } else {
      document.body.innerHTML = `
        <h3>⚠️ Query Executed But No Data</h3>
        <p>The query executed successfully but returned no rows.</p>
        <p>Check if the 'devices' table has data:</p>
        <code>SELECT count(*) FROM devices;</code>
      `;
    }
    
    context.notify.success('Query debugging completed - check console and panel content');
  } else {
    document.body.innerHTML = `
      <h3>❌ Query Failed or No Data</h3>
      <p>The query did not return expected data structure.</p>
      <p>Check browser console for detailed information.</p>
    `;
    context.notify.warning('Query returned unexpected result structure');
  }
  
} catch (error) {
  console.error('PostgreSQL debugging failed:', error);
  context.notify.error('Debugging failed: ' + error.message);
  
  document.body.innerHTML = `
    <h3>❌ Debugging Failed</h3>
    <p>Error: <code>${error.message}</code></p>
    <p>Check browser console for stack trace.</p>
  `;
}

console.log('=== PostgreSQL DEBUGGING END ===');
