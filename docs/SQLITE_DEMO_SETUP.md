# SQLite Demo Setup for Business Text Panel

This setup provides a SQLite datasource with a pre-populated `devices` table for testing the Business Text panel's data-driven features, specifically the learning panel edit functionality.

## Files Created

1. **`provisioning/datasources/sqlite.yml`** - SQLite datasource configuration for Grafana
2. **`scripts/create-sqlite-db.sh`** - Script to create the SQLite database with sample data
3. **`provisioning/dashboards/sqlite-demo.json`** - Demo dashboard using SQLite data
4. **`examples/learning-panel-edit-sqlite.js`** - Modified version of learning-panel-edit.js for SQLite

## Database Structure

The SQLite database contains a `devices` table with the following structure:

```sql
CREATE TABLE devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hostname TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    mac_address TEXT,
    os TEXT,
    status TEXT,
    last_seen_at INTEGER,  -- Unix timestamp
    created_at INTEGER,    -- Unix timestamp  
    password TEXT,
    username TEXT
);
```

### Sample Data

The database is pre-populated with 10 realistic IoT device records matching your original PostgreSQL data, including:
- Gateway devices with various statuses (online, offline, maintenance)
- Different IP ranges and MAC addresses
- Unix timestamps for temporal fields
- Mixed username/password combinations

## Setup Instructions

### 1. Create the SQLite Database

```bash
# Run the database creation script
./scripts/create-sqlite-db.sh
```

This creates `/tmp/devices.db` with the devices table and sample data.

### 2. Start Grafana with SQLite Support

The docker-compose.yml has been updated to include the SQLite plugin and mount the database:

```bash
# Start Grafana with SQLite support
docker compose --profile dev up
```

### 3. Configure the Datasource

The SQLite datasource will be automatically provisioned as "SQLite Demo" when Grafana starts.

**Manual Configuration (if needed):**
1. Go to Configuration → Data Sources
2. Add SQLite datasource
3. Set path to: `/var/lib/grafana/data/devices.db`
4. Test connection

### 4. Use the Demo Dashboard

A demo dashboard (`sqlite-demo.json`) is automatically provisioned with:
- Pie chart showing device status distribution
- Business Text panel with the interactive devices table

## Testing the Learning Panel Edit Script

### Using the SQLite Version

1. Create a new Business Text panel
2. Set datasource to "SQLite Demo"
3. Add query: `SELECT * FROM devices ORDER BY id`
4. In the "After Content Ready" section, paste the content from:
   ```
   examples/learning-panel-edit-sqlite.js
   ```

### Key Differences from PostgreSQL Version

The SQLite version includes:

1. **SQLite-specific SQL syntax**
   - Uses SQLite boolean handling (1/0 instead of true/false)
   - Proper timestamp handling for SQLite INTEGER timestamps

2. **Updated error messages**
   - References "SQLite" in error messages for clarity
   - Specific SQLite debugging information

3. **Datasource configuration**
   - Uses `sqlite-demo` as the default datasource UID
   - Can be changed by modifying `currentDataSourceUid` variable

## Features Supported

All features from the original PostgreSQL version work with SQLite:

✅ **Inline Editing** - Click any cell (except ID) to edit
✅ **Keyboard Navigation** - Tab/Shift+Tab to move between cells
✅ **Data Validation** - Timestamp format validation with visual feedback
✅ **Save/Cancel** - Individual row save/cancel operations
✅ **Delete Operations** - Row deletion with confirmation
✅ **Real-time Updates** - Changes reflected immediately in UI
✅ **Error Handling** - Comprehensive error reporting
✅ **Theme Integration** - Full Grafana theme support

## Verification Commands

```bash
# Check database contents
sqlite3 /tmp/devices.db "SELECT COUNT(*) FROM devices;"

# View sample data
sqlite3 /tmp/devices.db "SELECT hostname, ip_address, status FROM devices LIMIT 5;"

# Check table structure
sqlite3 /tmp/devices.db ".schema devices"
```

## Troubleshooting

### Common Issues

1. **"No Data" Error**
   - Verify SQLite database exists: `ls -la /tmp/devices.db`
   - Check Grafana logs for SQLite plugin installation
   - Ensure datasource UID matches in your panel configuration

2. **SQLite Plugin Not Found**
   - Restart Grafana to install plugins
   - Check docker-compose.yml includes `frser-sqlite-datasource`

3. **Database Not Found**
   - Run `./scripts/create-sqlite-db.sh` to create the database
   - Verify database is mounted in docker-compose.yml

4. **Permission Issues**
   - Check `/tmp/devices.db` file permissions
   - Ensure Grafana container can read the database file

### Debug Steps

1. **Check Plugin Installation**
   ```bash
   docker-compose exec grafana grafana-cli plugins ls
   ```

2. **Verify Database**
   ```bash
   docker-compose exec grafana ls -la /var/lib/grafana/data/devices.db
   ```

3. **Test Datasource**
   - Go to Grafana → Configuration → Data Sources
   - Click "SQLite Demo" → Test

## Extending the Demo

### Adding More Data

```sql
-- Connect to database
sqlite3 /tmp/devices.db

-- Add more devices
INSERT INTO devices (hostname, ip_address, mac_address, os, status, last_seen_at, created_at, username) 
VALUES ('new-device', '192.168.1.100', '00:1b:44:11:3a:ff', 'Linux', 'online', 1748928000000, 1748928000000, 'admin');
```

### Modifying Table Structure

```sql
-- Add new column
ALTER TABLE devices ADD COLUMN location TEXT;

-- Update existing records
UPDATE devices SET location = 'Building A' WHERE hostname LIKE '%floor%';
```

## Production Considerations

For production use:

1. **Move database to persistent storage** (not `/tmp`)
2. **Use proper SQLite file permissions**
3. **Implement database backups**
4. **Consider SQLite WAL mode** for better concurrency
5. **Add database indices** for better performance

This SQLite setup provides an identical testing environment to your PostgreSQL setup while being completely self-contained and easy to distribute for demo purposes.
