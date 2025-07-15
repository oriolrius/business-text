# Data Source Query Integration Implementation

## Summary of Implementation

I have successfully implemented comprehensive data source query integration for the Business Text plugin. Here's what has been added:

### Core Features Implemented

1. **New Type Definitions** (`src/types/dataSource.ts`)
   - `DataSourceContext` interface with query methods
   - `NotificationContext` interface for user notifications
   - `DataSourcePanelOptions` for configuration
   - Support for SQL, InfluxDB, and generic queries

2. **Data Source Service** (`src/utils/dataSource.ts`)
   - `createDataSourceContext()` - Main API factory
   - `createNotificationContext()` - Notification helpers
   - Query execution with timeout handling
   - Error handling and user feedback
   - Utility functions for result formatting

3. **Integration Points**
   - Updated `Row.tsx` component to include data source context
   - Extended `html.ts` generator to provide data source API
   - Updated `code-parameters.ts` for IntelliSense support
   - Modified panel options in `module.ts`

4. **Panel Configuration**
   - Enable/disable data source queries toggle
   - Query timeout configuration
   - Error notification settings
   - Proper migration support

5. **API Methods Available in JavaScript Context**
   ```javascript
   // Generic query execution
   context.dataSource.query(dataSourceUid, queryConfig)
   
   // SQL helper
   context.dataSource.sql(dataSourceUid, sqlQuery)
   
   // InfluxDB helper  
   context.dataSource.influx(dataSourceUid, influxQuery)
   
   // Get available data sources
   context.dataSource.getAvailable()
   
   // Utility functions
   context.dataSource.utils.formatResults(response)
   context.dataSource.utils.extractValues(response, fieldName)
   context.dataSource.utils.toObjects(response)
   
   // Notifications
   context.notify.success(message)
   context.notify.error(message)
   context.notify.warning(message)
   context.notify.info(message)
   ```

### Documentation

- **Comprehensive README.md section** with:
  - Feature overview and setup instructions
  - Complete API reference with examples
  - Usage examples for common scenarios
  - Best practices and security considerations
  - Multiple code examples showing different use cases

### Testing

- **Unit tests** (`src/utils/dataSource.test.ts`) covering:
  - Data source context creation
  - Notification context functionality
  - Query execution scenarios
  - Error handling
  - Utility function behavior

## Usage Examples

### Basic SQL Query
```javascript
async function loadData() {
  try {
    const result = await context.dataSource.sql('postgres-uid', 
      'SELECT count(*) as total FROM users WHERE active = true'
    );
    const count = context.dataSource.utils.extractValues(result, 'total')[0];
    document.getElementById('count').innerHTML = `Active Users: ${count}`;
    context.notify.success('Data loaded successfully');
  } catch (error) {
    context.notify.error('Failed to load data: ' + error.message);
  }
}
```

### Multiple Data Sources
```javascript
async function loadDashboard() {
  const [users, metrics] = await Promise.all([
    context.dataSource.sql('postgres-uid', 'SELECT * FROM users LIMIT 10'),
    context.dataSource.influx('influx-uid', 'SELECT mean("cpu") FROM "system"')
  ]);
  
  // Process and display data
  const userList = context.dataSource.utils.toObjects(users);
  const avgCpu = context.dataSource.utils.extractValues(metrics)[0];
  
  document.getElementById('users').innerHTML = JSON.stringify(userList, null, 2);
  document.getElementById('cpu').innerHTML = `CPU: ${avgCpu}%`;
}
```

### Time Range Aware Queries
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
  
  document.getElementById('metric').innerHTML = `Average: ${avgValue.toFixed(2)}`;
}
```

## Configuration

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

## Benefits

1. **Enhanced Interactivity**: Create dynamic content based on real-time data
2. **Multi-Source Integration**: Combine data from multiple sources in one panel
3. **Custom Business Logic**: Implement complex data processing in JavaScript
4. **User-Friendly**: Notifications keep users informed of data loading status
5. **Performance**: Configurable timeouts and error handling
6. **Security**: Leverages Grafana's existing permission system

## Next Steps

1. **Enable the feature** in panel options
2. **Test with your data sources** using the provided examples
3. **Customize for your use case** with specific queries and processing
4. **Monitor performance** and adjust timeout settings as needed

The implementation provides a powerful foundation for creating dynamic, data-driven text panels that can interact with any Grafana data source while maintaining security and performance standards.
