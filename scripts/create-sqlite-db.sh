#!/bin/bash

# Create SQLite database with devices table and sample data
# This script creates a mocked devices database for testing the Business Text panel

DB_PATH="./tmp/devices.db"

# Create tmp directory if it doesn't exist
mkdir -p ./tmp

# Remove existing database if it exists
rm -f "$DB_PATH"

# Create the database and table
sqlite3 "$DB_PATH" << 'EOF'
-- Create devices table with the same structure as PostgreSQL
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

-- Insert sample data matching the screenshot structure
INSERT INTO devices (hostname, ip_address, mac_address, os, status, last_seen_at, created_at, password, username) VALUES
('iot-gateway-floor2', '192.168.1.20', '00:1b:44:11:3a:b8', 'Linux Embedded', 'online', 1748927482567, 1748928082567, NULL, 'oriol'),
('iot-gateway-warehouse', '192.168.1.30', '00:1b:44:11:3a:b9', 'Linux Embedded', 'offline', 1748928482567, 1748928082567, NULL, 'oriol'),
('iot-gateway-parking', '192.168.1.40', '00:1b:44:11:3a:ba', 'Linux Embedded', 'online', 1748926022567, 1748928082567, NULL, 'orioleus'),
('iot-gateway-office', '192.168.1.91', '00:1b:44:11:3a:bf', 'Linux Embedded', 'online', 1748925382567, 1748928082567, NULL, NULL),
('iot-gateway-building-a', '192.168.1.51', '00:1b:44:11:3a:bb', 'Linux Embedded', 'maintenance', 1748928282567, 1748928082567, NULL, NULL),
('iot-gateway-building-b', '192.168.1.61', '00:1b:44:11:3a:bc', 'Linux Embedded', 'online', 1748927902567, 1748928082567, NULL, NULL),
('iot-gateway-production', '192.168.1.70', '00:1b:44:11:3a:bd', 'Linux Embedded', 'online', 1748927382567, 1748928082567, 'multiss', 'null'),
('iot-gateway-lab', '192.168.1.80', '00:1b:44:11:3a:be', 'Linux Embedded', 'offline', 1748641082567, 1748928082567, 'multiss', 'multiss'),
('iot-gateway-datacenter', '10.2.0.210', '00:1b:44:11:3a:c0', 'Linux Embedded', 'online', 1748928682567, 1748928082567, 'access', 'root'),
('testrig01', '1.3.3.4', NULL, NULL, 'unknown', 1750913364753, 1750913364753, NULL, NULL);

-- Create indexes for better performance
CREATE INDEX idx_devices_hostname ON devices(hostname);
CREATE INDEX idx_devices_ip_address ON devices(ip_address);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_last_seen_at ON devices(last_seen_at);

-- Display the created data
.headers on
.mode table
SELECT * FROM devices ORDER BY id;
EOF

# Set proper ownership to grafana user (uid 472)
sudo chown 472:472 "$DB_PATH" 2>/dev/null || echo "Warning: Could not set ownership to 472:472. Database may need manual permission fix."

echo "SQLite database created at: $DB_PATH"
echo "Total records: $(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM devices;")"
echo ""
echo "Sample query to test:"
echo "sqlite3 $DB_PATH \"SELECT hostname, ip_address, status FROM devices LIMIT 5;\""
echo ""
echo "Database ownership:"
ls -la "$DB_PATH"
