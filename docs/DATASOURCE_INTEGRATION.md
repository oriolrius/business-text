# Data Source Query Integration

The Business Text panel supports executing queries against any configured Grafana data source directly from your custom JavaScript code. This powerful feature allows you to:

- Fetch data from databases, APIs, and other data sources
- Combine multiple data sources in a single visualization  
- Create dynamic content based on real-time queries
- Build interactive dashboards with custom data processing

## Enabling Data Source Queries

1. In the panel options, navigate to the **Data Source** section
2. Enable **"Enable Data Source Queries"**
3. Configure the query timeout (default: 30 seconds)
4. Optionally enable error notifications

## API Reference

Once enabled, the `context.dataSource` object provides the following methods in your JavaScript code:

### Generic Query Method

```javascript
// Execute any query against a data source
const result = await context.dataSource.query(dataSourceUid, queryConfig);
```

### SQL Helper Method

```javascript
// Execute SQL queries against SQL-based data sources
const result = await context.dataSource.sql('postgres-uid', 'SELECT * FROM users WHERE active = true');
```

### InfluxDB Helper Method

```javascript
// Execute InfluxDB queries
const result = await context.dataSource.influx('influxdb-uid', 'SELECT mean("cpu") FROM "system"');
```

### Utility Methods

```javascript
// Get available data sources
const dataSources = context.dataSource.getAvailable();

// Format query results for easier consumption
const formatted = context.dataSource.utils.formatResults(result);

// Extract values from specific fields
const values = context.dataSource.utils.extractValues(result, 'fieldName');

// Convert to simple object array
const objects = context.dataSource.utils.toObjects(result);
```

### Notification API

```javascript
// Show notifications to users
context.notify.success('Data loaded successfully!');
context.notify.error('Failed to fetch data');
context.notify.warning('Data might be outdated');
context.notify.info('Processing data...');
```

## Async/Await Support

The Business Text panel **automatically detects** when your JavaScript code contains `await` keywords and converts your code to run in an async context. This means you can use modern async/await syntax seamlessly:

```javascript
// ✅ This works - async/await is automatically supported
const data = await context.dataSource.sql('my-db', 'SELECT * FROM users');
console.log('Data loaded:', data);

// ✅ Multiple await calls work too
const users = await context.dataSource.sql('my-db', 'SELECT * FROM users');
const orders = await context.dataSource.sql('my-db', 'SELECT * FROM orders');
console.log('Both queries completed');

// ✅ Error handling with try/catch
try {
  const result = await context.dataSource.query('my-source', { query: 'complex-query' });
  context.notify.success('Query successful!');
} catch (error) {
  context.notify.error('Query failed: ' + error.message);
}
```

**Note**: If your code doesn't contain `await`, it runs as a regular synchronous function for optimal performance.

## Troubleshooting

### Finding Data Source UIDs

If you're getting "data source not found" errors, use this code to list all available data sources:

```javascript
// List all available data sources
const dataSources = context.dataSource.getAvailable();
console.log('Available data sources:', dataSources);

// Show in panel
const list = dataSources.map(ds => `${ds.name} (${ds.uid}) - Type: ${ds.type}`).join('<br>');
document.body.innerHTML = `<h3>Available Data Sources:</h3>${list}`;
```

### Get Data Source by Name

If you know the data source name but not the UID:

```javascript
const dataSource = await context.dataSource.getByName('My Database');
if (dataSource) {
  console.log('Found data source:', dataSource.uid, dataSource.type);
} else {
  console.log('Data source not found');
}
```

### Debug Query Issues

Enable detailed logging to debug query problems:

```javascript
try {
  // This will log data source info and query details to browser console
  const result = await context.dataSource.sql('your-datasource-uid', 'SELECT 1 as test');
  console.log('Success:', result);
} catch (error) {
  console.error('Query failed:', error.message);
  context.notify.error('Query error: ' + error.message);
}
```

## Usage Examples

### Basic SQL Query

```javascript
async function loadUserCount() {
  try {
    const result = await context.dataSource.sql('postgres-uid', 
      'SELECT count(*) as total_users FROM users WHERE active = true'
    );
    
    const count = context.dataSource.utils.extractValues(result, 'total_users')[0];
    document.getElementById('user-count').innerHTML = `Active Users: ${count}`;
  } catch (error) {
    context.notify.error('Failed to load user data: ' + error.message);
  }
}

loadUserCount();
```

### Time Range Aware Query

```javascript
async function loadMetrics() {
  const timeRange = context.grafana.timeRange;
  const query = `
    SELECT avg(value) as avg_value 
    FROM metrics 
    WHERE timestamp >= '${timeRange.from.toISOString()}'
    AND timestamp <= '${timeRange.to.toISOString()}'
  `;
  
  const result = await context.dataSource.sql('mysql-uid', query);
  const avgValue = context.dataSource.utils.extractValues(result, 'avg_value')[0];
  
  document.getElementById('avg-metric').innerHTML = `Average: ${avgValue.toFixed(2)}`;
}
```

### Multiple Data Sources

```javascript
async function loadDashboardData() {
  try {
    // Get available data sources
    const dataSources = context.dataSource.getAvailable();
    console.log('Available data sources:', dataSources);
    
    // Query different sources
    const [sqlData, influxData] = await Promise.all([
      context.dataSource.sql('postgres-uid', 'SELECT * FROM summary'),
      context.dataSource.influx('influxdb-uid', 'SELECT mean("cpu") FROM "system"')
    ]);
    
    // Process and display combined data
    const summary = context.dataSource.utils.toObjects(sqlData);
    const metrics = context.dataSource.utils.toObjects(influxData);
    
    document.getElementById('summary').innerHTML = JSON.stringify(summary, null, 2);
    document.getElementById('metrics').innerHTML = JSON.stringify(metrics, null, 2);
    
    context.notify.success('Data loaded from multiple sources');
  } catch (error) {
    context.notify.error('Failed to load dashboard data: ' + error.message);
  }
}

loadDashboardData();
```

### Dynamic Content with Variables

```javascript
async function loadUserData() {
  // Use Grafana variables in queries
  const userId = context.grafana.replaceVariables('$user_id');
  const query = `SELECT name, email, last_login FROM users WHERE id = ${userId}`;
  
  const result = await context.dataSource.sql('postgres-uid', query);
  const user = context.dataSource.utils.toObjects(result)[0];
  
  if (user) {
    document.getElementById('user-info').innerHTML = `
      <h3>${user.name}</h3>
      <p>Email: ${user.email}</p>
      <p>Last Login: ${new Date(user.last_login).toLocaleString()}</p>
    `;
  } else {
    context.notify.warning('User not found');
  }
}
```

## Best Practices

1. **Error Handling**: Always wrap data source queries in try-catch blocks
2. **Timeouts**: Set appropriate query timeouts based on your data source performance
3. **Caching**: Consider implementing client-side caching for frequently accessed data
4. **Security**: Be cautious with dynamic SQL queries to prevent injection attacks
5. **Performance**: Use specific field selections instead of `SELECT *` for better performance
6. **User Feedback**: Use the notification API to keep users informed of data loading status

## Security Considerations

- Data source queries respect Grafana's existing data source permissions
- Users can only query data sources they have access to in Grafana
- SQL injection protection should be implemented in your queries
- Consider enabling query error notifications for debugging

## Configuration Options

### Panel Options
- Navigate to panel settings → Data Source section
- Enable "Enable Data Source Queries"
- Set query timeout (default: 30 seconds)
- Configure error notifications

### Security Features
- Respects existing Grafana data source permissions
- Users can only query accessible data sources
- Proper error handling and timeout management
- Optional query error notifications

## Troubleshooting

### Common Issues

1. **"Data source queries are disabled"**
   - Enable the feature in panel options under Data Source section

2. **"Data source with UID 'xyz' not found"**
   - Verify the data source UID is correct
   - Check that you have access to the data source

3. **Query timeout errors**
   - Increase the timeout value in panel options
   - Optimize your queries for better performance

4. **Permission denied errors**
   - Ensure your Grafana user has access to the data source
   - Check data source permissions in Grafana settings

### Debug Mode

Enable "Show Query Errors" in panel options to see detailed error messages in notifications.
