/**
 * SQLite Device Management - Utility Functions
 * Extracted utility functions for maintainability and reusability
 */

// Global variables for device management state
window.DeviceManagement = window.DeviceManagement || {};
const DM = window.DeviceManagement;

// Initialize state variables
DM.state = {
  currentDataSourceUid: 'sqlite-demo',
  editingCell: null,
  originalValues: {},
  tableStructure: null,
  currentFocusedInput: null
};

/**
 * Helper function to format display values (especially timestamps)
 * @param {string} fieldName - The name of the field
 * @param {*} value - The value to format
 * @returns {string} Formatted display value
 */
DM.formatDisplayValue = function(fieldName, value) {
  if (value === null || value === undefined || value === '') {
    return '<em style="color: var(--text-secondary);">null</em>';
  }

  // Handle timestamp fields for SQLite (Unix timestamps)
  const timestampPatterns = [
    /.*_at$/i, /.*_time$/i, /.*timestamp$/i, /^date$/i, /^time$/i
  ];
  
  const isTimestampField = timestampPatterns.some(pattern => pattern.test(fieldName));
  
  if (isTimestampField && /^\d{10,13}$/.test(String(value))) {
    // Convert Unix timestamp to readable format
    const timestamp = parseInt(value);
    const date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);
    return `<span title="Unix: ${value}">${date.toLocaleString()}</span>`;
  }

  return String(value);
};

/**
 * Helper function to detect ID field using common patterns
 * @param {Array} fields - Array of field names
 * @returns {string} The detected ID field name
 */
DM.detectIdField = function(fields) {
  // Common ID field patterns (case-insensitive)
  const idPatterns = [
    /^id$/i,           // exact match: "id"
    /^.*_id$/i,        // ends with "_id": "user_id", "device_id"
    /^id_.*$/i,        // starts with "id_": "id_user", "id_device"
    /^.*id$/i,         // ends with "id": "userid", "deviceid"
    /^uid$/i,          // exact match: "uid"
    /^uuid$/i,         // exact match: "uuid"
    /^pk$/i,           // exact match: "pk" (primary key)
    /^primary_key$/i   // exact match: "primary_key"
  ];

  // Find first field matching ID patterns
  for (const pattern of idPatterns) {
    const idField = fields.find(field => pattern.test(field));
    if (idField) return idField;
  }

  // Fallback: return first field (most common case)
  return fields[0];
};

/**
 * Helper function to check if a field is an ID field
 * @param {string} fieldName - The field name to check
 * @param {Array} allFields - Array of all field names
 * @returns {boolean} True if the field is an ID field
 */
DM.isIdField = function(fieldName, allFields) {
  return fieldName === DM.detectIdField(allFields);
};

/**
 * Helper function to format SQL values for SQLite
 * @param {string} fieldName - The field name
 * @param {*} value - The value to format
 * @returns {string} Formatted SQL value
 */
DM.formatSqlValue = function(fieldName, value) {
  // Handle null values
  if (value === null || value === 'null' || value === '') {
    return 'NULL';
  }

  // Convert to string and trim
  const stringValue = String(value).trim();

  // Handle timestamp fields (SQLite specific)
  const timestampPatterns = [
    /.*_at$/i,        // ends with "_at": created_at, updated_at, last_seen_at
    /.*_time$/i,      // ends with "_time": start_time, end_time
    /.*timestamp$/i,  // ends with "timestamp"
    /^date$/i,        // exact: "date"
    /^time$/i         // exact: "time"
  ];

  const isTimestampField = timestampPatterns.some(pattern => pattern.test(fieldName));

  if (isTimestampField) {
    // Check if it's a Unix timestamp (numbers only, reasonable length)
    if (/^\d{10,13}$/.test(stringValue)) {
      return stringValue; // Keep as number for SQLite
    }

    // Check if it's already a valid date string
    const parsedDate = new Date(stringValue);
    if (!isNaN(parsedDate.getTime())) {
      // Convert to Unix timestamp for SQLite (milliseconds to seconds)
      return Math.floor(parsedDate.getTime() / 1000);
    }

    // If we can't parse it as a date, treat it as NULL
    return 'NULL';
  }

  // Handle numeric fields
  if (/^-?\d+(\.\d+)?$/.test(stringValue)) {
    return stringValue; // No quotes for numbers
  }

  // Handle boolean fields (SQLite uses 1/0 for boolean)
  if (stringValue.toLowerCase() === 'true' || stringValue.toLowerCase() === 'false') {
    return stringValue.toLowerCase() === 'true' ? '1' : '0';
  }

  // Default: treat as string with proper escaping for SQLite
  return `'${stringValue.replace(/'/g, "''")}'`;
};

/**
 * Input validation with visual feedback
 * @param {HTMLInputElement} input - The input element to validate
 * @param {Object} theme - Grafana theme object
 * @returns {boolean} True if validation passes
 */
DM.validateInput = function(input, theme) {
  const value = input.value.trim();
  const fieldName = input.getAttribute('data-field');

  // Basic validation
  if (value === '') {
    input.style.borderColor = theme.colors.warning.border;
    input.style.boxShadow = `0 0 0 2px ${theme.colors.warning.transparent}`;
    input.title = 'Field cannot be empty';
    return false;
  }

  // Validate timestamp fields
  const timestampPatterns = [
    /.*_at$/i, /.*_time$/i, /.*timestamp$/i, /^date$/i, /^time$/i
  ];

  const isTimestampField = timestampPatterns.some(pattern => pattern.test(fieldName));

  if (isTimestampField) {
    // Check if it's a valid Unix timestamp
    if (/^\d{10,13}$/.test(value)) {
      const timestamp = parseInt(value);
      const date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);

      if (isNaN(date.getTime())) {
        input.style.borderColor = theme.colors.error.border;
        input.style.boxShadow = `0 0 0 2px ${theme.colors.error.transparent}`;
        input.title = 'Invalid timestamp format';
        return false;
      }

      // Show parsed date in tooltip for validation
      input.title = `Will be saved as: ${date.toISOString()}`;
      input.style.borderColor = theme.colors.success.border;
      input.style.boxShadow = `0 0 0 2px ${theme.colors.success.transparent}`;
      return true;
    }

    // Check if it's a valid date string
    const parsedDate = new Date(value);
    if (!isNaN(parsedDate.getTime())) {
      input.title = `Will be saved as: ${parsedDate.toISOString()}`;
      input.style.borderColor = theme.colors.success.border;
      input.style.boxShadow = `0 0 0 2px ${theme.colors.success.transparent}`;
      return true;
    }

    // Invalid timestamp format
    input.style.borderColor = theme.colors.error.border;
    input.style.boxShadow = `0 0 0 2px ${theme.colors.error.transparent}`;
    input.title = 'Invalid date/time format. Use Unix timestamp (e.g., 1671234567) or ISO date (e.g., 2023-12-17T10:30:00Z)';
    return false;
  }

  // Default validation passed
  input.style.borderColor = theme.colors.border.medium;
  input.style.boxShadow = 'none';
  input.title = '';
  return true;
};

/**
 * Get next editable cell for keyboard navigation
 * @param {HTMLElement} currentCell - Current cell element
 * @returns {HTMLElement|null} Next editable cell or null
 */
DM.getNextEditableCell = function(currentCell) {
  const row = currentCell.closest('tr');
  const allCells = Array.from(row.querySelectorAll('.editable-cell'));
  const currentIndex = allCells.indexOf(currentCell);

  // Return next editable cell in same row, or first cell of next row
  if (currentIndex < allCells.length - 1) {
    return allCells[currentIndex + 1];
  } else {
    // Move to next row if available
    const nextRow = row.nextElementSibling;
    if (nextRow) {
      const firstEditableCell = nextRow.querySelector('.editable-cell');
      if (firstEditableCell) {
        // Switch to next row edit mode
        const nextRowIndex = nextRow.getAttribute('data-row-index');
        if (nextRowIndex !== DM.state.editingCell) {
          DM.ui.cancelEdit(DM.state.editingCell);
          DM.ui.enterEditMode(nextRowIndex);
          return firstEditableCell;
        }
      }
    }
  }
  return null;
};

/**
 * Get previous editable cell for keyboard navigation
 * @param {HTMLElement} currentCell - Current cell element
 * @returns {HTMLElement|null} Previous editable cell or null
 */
DM.getPreviousEditableCell = function(currentCell) {
  const row = currentCell.closest('tr');
  const allCells = Array.from(row.querySelectorAll('.editable-cell'));
  const currentIndex = allCells.indexOf(currentCell);

  // Return previous editable cell in same row, or last cell of previous row
  if (currentIndex > 0) {
    return allCells[currentIndex - 1];
  } else {
    // Move to previous row if available
    const prevRow = row.previousElementSibling;
    if (prevRow) {
      const lastEditableCell = prevRow.querySelector('.editable-cell:last-of-type');
      if (lastEditableCell) {
        // Switch to previous row edit mode
        const prevRowIndex = prevRow.getAttribute('data-row-index');
        if (prevRowIndex !== DM.state.editingCell) {
          DM.ui.cancelEdit(DM.state.editingCell);
          DM.ui.enterEditMode(prevRowIndex);
          return lastEditableCell;
        }
      }
    }
  }
  return null;
};

/**
 * Enhanced error handler for database operations
 * @param {Error} error - The error object
 * @param {string} operation - The operation that failed
 * @param {Object} context - Additional context for debugging
 * @returns {string} User-friendly error message
 */
DM.handleDatabaseError = function(error, operation, context = {}) {
  let errorMessage = 'Unknown error occurred';
  let errorDetails = '';

  if (error && error.message) {
    errorMessage = error.message;
  }

  // Check if it's a database query error with additional details
  if (error && error.data && error.data.results) {
    const results = error.data.results;
    Object.keys(results).forEach(key => {
      const result = results[key];
      if (result.error) {
        errorMessage = result.error;
        if (result.errorSource) {
          errorDetails += `Source: ${result.errorSource}. `;
        }

        // Extract the executed query for debugging
        if (result.frames && result.frames[0] && result.frames[0].schema && result.frames[0].schema.meta) {
          const executedQuery = result.frames[0].schema.meta.executedQueryString;
          if (executedQuery) {
            console.error(`Failed SQLite Query (${operation}):`, executedQuery);
            errorDetails += `Query: ${executedQuery.substring(0, 100)}${executedQuery.length > 100 ? '...' : ''}`;
          }
        }
      }
    });
  }

  // Log comprehensive error information
  console.error(`SQLite ${operation} operation failed:`, {
    originalError: error,
    processedMessage: errorMessage,
    errorDetails: errorDetails,
    context: context
  });

  // Return user-friendly error message
  return `SQLite ${operation} failed: ${errorMessage}${errorDetails ? ' | ' + errorDetails : ''}`;
};

/**
 * Utility function to show notification with consistent styling
 * @param {string} type - Notification type ('success', 'error', 'warning', 'info')
 * @param {string} message - The message to display
 */
DM.notify = function(type, message) {
  if (window.context && window.context.grafana) {
    switch (type) {
      case 'success':
        window.context.grafana.notifySuccess(['Success', message]);
        break;
      case 'error':
        window.context.grafana.notifyError(['Error', message]);
        break;
      case 'warning':
        window.context.grafana.notifyWarning && window.context.grafana.notifyWarning(message);
        break;
      case 'info':
      default:
        window.context.grafana.notifyInfo && window.context.grafana.notifyInfo(message);
        break;
    }
  } else {
    // Fallback for testing/development
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
};

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately
 * @returns {Function} Debounced function
 */
DM.debounce = function(func, wait, immediate) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
};

/**
 * Clean up function to remove global event listeners and reset state
 */
DM.cleanup = function() {
  // Remove global event listeners
  if (DM.ui && DM.ui.handleGlobalKeyboard) {
    document.removeEventListener('keydown', DM.ui.handleGlobalKeyboard);
  }
  
  // Reset state
  DM.state.editingCell = null;
  DM.state.currentFocusedInput = null;
  DM.state.originalValues = {};
  DM.state.tableStructure = null;
  
  console.log('Device Management utilities cleaned up');
};

// Initialize utility module
console.log('Device Management utilities loaded');