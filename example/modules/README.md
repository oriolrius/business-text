# SQLite Device Management - Modular JavaScript Architecture

This directory contains the modular JavaScript implementation of the SQLite Device Management system for Grafana's Business Text panel.

## Dashboard Usage

This modular architecture is used by the following provisioned dashboard:
- **Dashboard**: `SQLite Device Management - Modular Architecture`
- **UID**: `sqlite-device-modular`
- **Location**: `/static/provisioning/dashboards/sqlite-device-management-modular.json`
- **Module Loading**: The dashboard loads all modules via the Business Text panel's `externalScripts` configuration
- **Entry Point**: The dashboard loads `main.js` via the `afterRenderRemoteUrl` setting, which initializes the system

## Architecture Overview

The system is split into semantic modules, each responsible for a specific aspect of the device management functionality. All modules are loaded by the Business Text panel in the correct order through the `externalScripts` configuration, and then `main.js` initializes the application.

## Module Files

### 📄 main.js
**Purpose**: Application entry point
- Called after all modules are loaded by the Business Text panel
- Initializes the device management system by calling `window.initializeDeviceManagement()`
- Simple entry point that ensures the application starts correctly

### ⚙️ config.js
**Purpose**: Central configuration and constants
- Database configuration (datasource UID, table name)
- FontAwesome CDN configuration
- Regular expression patterns for timestamp and ID field detection
- Column width definitions for the table layout
- Centralized settings that can be easily modified

### 🛠️ utils.js
**Purpose**: Utility functions used across modules
- `formatDisplayValue()` - Formats values for display (handles timestamps, nulls)
- `detectIdField()` - Automatically detects ID fields using common patterns
- `isIdField()` - Checks if a field is an ID field
- `formatSqlValue()` - Formats values for SQLite queries (handles types, escaping)
- `cleanup()` - Removes global event listeners and resets state

### 🎨 table-renderer.js
**Purpose**: Table rendering and UI generation
- `renderDevicesTable()` - Main function to render the device table
- `renderTableHeaders()` - Creates table headers with frozen columns
- `renderTableRows()` - Generates table rows with alternating colors
- `renderActionsCell()` - Creates action buttons (edit, save, cancel, delete)
- `renderFrozenCell()` - Renders frozen columns (hostname, ip_address)
- Handles Grafana theme integration for consistent styling

### ✏️ edit-mode.js
**Purpose**: Inline editing functionality
- `enterEditMode()` - Switches a row to edit mode
- `makeInlineEditable()` - Converts a cell to an input field
- `handleInputKeyboard()` - Keyboard navigation within edit mode
- `validateInput()` - Real-time input validation with visual feedback
- `getNextEditableCell()` / `getPreviousEditableCell()` - Cell navigation
- `cancelEdit()` - Cancels editing and restores original values
- `exitEditMode()` - Exits edit mode and resets UI state
- Global state management for editing operations

### 💾 crud-operations.js
**Purpose**: Database operations (Create, Read, Update, Delete)
- `loadDevices()` - Fetches and displays devices from SQLite
- `saveRow()` - Updates a device record in the database
- `deleteDevice()` - Removes a device from the database
- Handles SQLite-specific query formatting
- Provides comprehensive error handling and user notifications
- Manages the global datasource UID and table structure

### 🎯 event-handlers.js
**Purpose**: Event handling and user interactions
- `addEventListeners()` - Attaches all event listeners after table render
- `handleGlobalKeyboard()` - Global keyboard shortcuts (Esc, Ctrl+S)
- Manages click events for edit, save, cancel, and delete actions
- Handles cell click events for inline editing
- Coordinates between UI events and corresponding actions

### 🚀 device-manager.js
**Purpose**: Main initialization and coordination
- `initializeDeviceManagement()` - Entry point for the application
- Ensures FontAwesome is loaded (with fallback)
- Waits for DOM to be ready before initialization
- Attaches the main "Load Devices" button event
- Provides logging for debugging initialization issues

## Module Dependencies

The modules are loaded in this order by the dashboard's `externalScripts` configuration:

```
1. config.js (no dependencies)
2. utils.js (depends on: config.js)
3. table-renderer.js (depends on: config.js, utils.js)
4. edit-mode.js (depends on: config.js, utils.js)
5. crud-operations.js (depends on: config.js, utils.js, table-renderer.js)
6. event-handlers.js (depends on: edit-mode.js, crud-operations.js)
7. device-manager.js (depends on: all above modules)

After all modules are loaded:
→ main.js (initializes the application)
```

## Key Features

1. **Modular Architecture**: Clean separation of concerns with each module handling specific functionality
2. **SQLite Compatibility**: Handles SQLite-specific data types and query formatting
3. **Inline Editing**: Click any cell to edit with real-time validation
4. **Keyboard Navigation**: Full keyboard support for efficient data entry
5. **Frozen Columns**: Hostname and IP address columns remain visible during horizontal scrolling
6. **Theme Integration**: Fully integrated with Grafana's theming system
7. **Error Handling**: Comprehensive error handling with user-friendly notifications

## Usage

The modules are automatically loaded by the Business Text panel when the dashboard is opened. Users interact with the system by:
1. Clicking "Load SQLite Devices" to fetch data
2. Using edit icons or clicking cells to modify data
3. Using keyboard shortcuts for navigation and actions
4. Saving or canceling changes per row
5. Deleting devices with confirmation

## Technical Notes

- All modules attach their functions to the `window` object for global accessibility
- The system uses Grafana's context API for database operations and notifications
- SQLite-specific handling includes Unix timestamp conversion and boolean 1/0 values
- The table structure is dynamically detected from the query results
- ID fields are automatically identified using common naming patterns

## Maintenance

To modify the system:
1. Edit the relevant module file based on the functionality you want to change
2. Ensure you don't break dependencies between modules
3. Test the changes by refreshing the dashboard
4. The Business Text panel will automatically load the updated modules

## Loading Configuration

The dashboard configuration loads modules in this way:
- **externalScripts**: Loads all dependency modules in the correct order
- **afterRenderRemoteUrl**: Loads main.js to initialize the application after all modules are ready