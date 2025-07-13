/**
 * Business Text Panel - Data Source Query Examples
 * 
 * These examples demonstrate how to use the new data source query
 * functionality in the "After Content Ready" JavaScript section.
 */

// Example 1: Basic SQL Query
async function loadUserCount() {
  try {
    const result = await context.dataSource.sql('postgres-uid', 
      'SELECT count(*) as total_users FROM users WHERE active = true'
    );
    
    const count = context.dataSource.utils.extractValues(result, 'total_users')[0];
    
    // Update the DOM
    const element = document.getElementById('user-count');
    if (element) {
      element.innerHTML = `Active Users: ${count}`;
    }
    
    context.notify.success('User count loaded successfully');
  } catch (error) {
    context.notify.error('Failed to load user count: ' + error.message);
  }
}

// Example 2: Time Range Aware Query
async function loadTimeRangeData() {
  const timeRange = context.grafana.timeRange;
  const query = `
    SELECT 
      DATE_TRUNC('hour', timestamp) as hour,
      COUNT(*) as events
    FROM event_log 
    WHERE timestamp >= '${timeRange.from.toISOString()}'
    AND timestamp <= '${timeRange.to.toISOString()}'
    GROUP BY hour
    ORDER BY hour
  `;
  
  try {
    const result = await context.dataSource.sql('postgres-uid', query);
    const events = context.dataSource.utils.toObjects(result);
    
    // Create a simple chart or table
    const tableHtml = `
      <table>
        <thead>
          <tr><th>Hour</th><th>Events</th></tr>
        </thead>
        <tbody>
          ${events.map(row => `
            <tr>
              <td>${new Date(row.hour).toLocaleString()}</td>
              <td>${row.events}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    const element = document.getElementById('events-table');
    if (element) {
      element.innerHTML = tableHtml;
    }
  } catch (error) {
    context.notify.error('Failed to load time range data: ' + error.message);
  }
}

// Example 3: Multiple Data Sources
async function loadDashboardMetrics() {
  try {
    context.notify.info('Loading dashboard metrics...');
    
    // Query multiple data sources in parallel
    const [userStats, systemMetrics, businessData] = await Promise.all([
      context.dataSource.sql('postgres-uid', 'SELECT COUNT(*) as users, AVG(age) as avg_age FROM users'),
      context.dataSource.influx('influx-uid', 'SELECT mean("cpu_usage") as cpu, mean("memory_usage") as memory FROM system_metrics WHERE time > now() - 1h'),
      context.dataSource.query('api-datasource-uid', { 
        endpoint: '/api/business-metrics',
        format: 'json' 
      })
    ]);
    
    // Process results
    const users = context.dataSource.utils.toObjects(userStats)[0];
    const system = context.dataSource.utils.toObjects(systemMetrics)[0];
    const business = context.dataSource.utils.formatResults(businessData);
    
    // Update dashboard
    document.getElementById('user-stats').innerHTML = `
      <h3>User Statistics</h3>
      <p>Total Users: ${users.users}</p>
      <p>Average Age: ${users.avg_age?.toFixed(1)}</p>
    `;
    
    document.getElementById('system-stats').innerHTML = `
      <h3>System Metrics</h3>
      <p>CPU Usage: ${system.cpu?.toFixed(1)}%</p>
      <p>Memory Usage: ${system.memory?.toFixed(1)}%</p>
    `;
    
    document.getElementById('business-metrics').innerHTML = `
      <h3>Business Metrics</h3>
      <pre>${JSON.stringify(business.rows, null, 2)}</pre>
    `;
    
    context.notify.success('Dashboard metrics loaded successfully');
  } catch (error) {
    context.notify.error('Failed to load dashboard metrics: ' + error.message);
  }
}

// Example 4: Dynamic Query with Variables
async function loadFilteredData() {
  // Use Grafana dashboard variables
  const region = context.grafana.replaceVariables('$region');
  const dateRange = context.grafana.replaceVariables('$__timeFilter(timestamp)');
  
  const query = `
    SELECT 
      product_name,
      SUM(sales_amount) as total_sales,
      COUNT(order_id) as order_count
    FROM sales_data 
    WHERE region = '${region}' 
    AND ${dateRange}
    GROUP BY product_name
    ORDER BY total_sales DESC
    LIMIT 10
  `;
  
  try {
    const result = await context.dataSource.sql('sales-db-uid', query);
    const products = context.dataSource.utils.toObjects(result);
    
    const chartHtml = `
      <div class="sales-chart">
        <h3>Top Products in ${region}</h3>
        ${products.map((product, index) => `
          <div class="product-row">
            <span class="rank">#${index + 1}</span>
            <span class="name">${product.product_name}</span>
            <span class="sales">$${product.total_sales?.toLocaleString()}</span>
            <span class="orders">(${product.order_count} orders)</span>
          </div>
        `).join('')}
      </div>
    `;
    
    document.getElementById('top-products').innerHTML = chartHtml;
  } catch (error) {
    context.notify.error('Failed to load filtered data: ' + error.message);
  }
}

// Example 5: Error Handling and Data Validation
async function loadWithValidation() {
  try {
    // Check if data sources are available
    const availableDataSources = context.dataSource.getAvailable();
    const postgresSource = availableDataSources.find(ds => ds.type === 'postgres');
    
    if (!postgresSource) {
      context.notify.warning('PostgreSQL data source not available');
      return;
    }
    
    context.notify.info('Loading data...');
    
    const result = await context.dataSource.sql(postgresSource.uid, 
      'SELECT status, COUNT(*) as count FROM orders WHERE created_at > NOW() - INTERVAL \'24 hours\' GROUP BY status'
    );
    
    const orders = context.dataSource.utils.toObjects(result);
    
    if (orders.length === 0) {
      context.notify.warning('No orders found in the last 24 hours');
      document.getElementById('order-status').innerHTML = '<p>No recent orders</p>';
      return;
    }
    
    // Validate data structure
    const validOrders = orders.filter(order => order.status && typeof order.count === 'number');
    
    if (validOrders.length !== orders.length) {
      context.notify.warning('Some order data was invalid and filtered out');
    }
    
    const statusHtml = `
      <div class="order-status">
        <h3>Order Status (Last 24h)</h3>
        ${validOrders.map(order => `
          <div class="status-item">
            <span class="status-label">${order.status}</span>
            <span class="status-count">${order.count}</span>
          </div>
        `).join('')}
      </div>
    `;
    
    document.getElementById('order-status').innerHTML = statusHtml;
    context.notify.success(`Loaded ${validOrders.length} order statuses`);
    
  } catch (error) {
    console.error('Data loading error:', error);
    context.notify.error('Failed to load order status data');
    
    // Provide fallback content
    document.getElementById('order-status').innerHTML = '<p>Data temporarily unavailable</p>';
  }
}

// Execute the examples (uncomment the ones you want to run)
// loadUserCount();
// loadTimeRangeData();
// loadDashboardMetrics();
// loadFilteredData();
// loadWithValidation();
