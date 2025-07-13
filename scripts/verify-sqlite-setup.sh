#!/bin/bash

# SQLite Demo Verification Script
# This script verifies that the SQLite setup is working correctly

echo "🔍 SQLite Demo Setup Verification"
echo "=================================="
echo ""

# Check if database exists
if [ -f "/tmp/devices.db" ]; then
    echo "✅ SQLite database exists at /tmp/devices.db"
else
    echo "❌ SQLite database NOT found at /tmp/devices.db"
    echo "   Run: ./scripts/create-sqlite-db.sh"
    exit 1
fi

# Check database content
echo ""
echo "📊 Database Statistics:"
total_devices=$(sqlite3 /tmp/devices.db "SELECT COUNT(*) FROM devices;")
echo "   Total devices: $total_devices"

online_devices=$(sqlite3 /tmp/devices.db "SELECT COUNT(*) FROM devices WHERE status = 'online';")
echo "   Online devices: $online_devices"

offline_devices=$(sqlite3 /tmp/devices.db "SELECT COUNT(*) FROM devices WHERE status = 'offline';")
echo "   Offline devices: $offline_devices"

maintenance_devices=$(sqlite3 /tmp/devices.db "SELECT COUNT(*) FROM devices WHERE status = 'maintenance';")
echo "   Maintenance devices: $maintenance_devices"

echo ""
echo "📋 Sample Data (first 3 devices):"
sqlite3 /tmp/devices.db -header -column "SELECT id, hostname, ip_address, status FROM devices LIMIT 3;"

echo ""
echo "🔧 Configuration Files:"
if [ -f "provisioning/datasources/sqlite.yml" ]; then
    echo "   ✅ SQLite datasource config: provisioning/datasources/sqlite.yml"
else
    echo "   ❌ SQLite datasource config missing"
fi

if [ -f "provisioning/dashboards/sqlite-demo.json" ]; then
    echo "   ✅ Demo dashboard: provisioning/dashboards/sqlite-demo.json"
else
    echo "   ❌ Demo dashboard missing"
fi

if [ -f "examples/learning-panel-edit-sqlite.js" ]; then
    echo "   ✅ SQLite demo script: examples/learning-panel-edit-sqlite.js"
else
    echo "   ❌ SQLite demo script missing"
fi

echo ""
echo "🐳 Docker Compose Check:"
if grep -q "frser-sqlite-datasource" docker-compose.yml; then
    echo "   ✅ SQLite plugin configured in docker-compose.yml"
else
    echo "   ❌ SQLite plugin NOT configured in docker-compose.yml"
fi

if grep -q "/tmp/devices.db:/var/lib/grafana/data/devices.db" docker-compose.yml; then
    echo "   ✅ Database volume mount configured"
else
    echo "   ❌ Database volume mount NOT configured"
fi

echo ""
echo "🚀 Next Steps:"
echo "   1. Start Grafana: docker-compose --profile dev up"
echo "   2. Open Grafana: http://localhost:3000"
echo "   3. Check datasource: Configuration → Data Sources → SQLite Demo"
echo "   4. Open demo dashboard: SQLite Devices Demo"
echo "   5. Test learning panel edit functionality"
echo ""
echo "📚 For detailed instructions, see: docs/SQLITE_DEMO_SETUP.md"
