console.debug('start: utils.js');

// Utility functions for device management

// Helper function to format display values (especially timestamps)
window.formatDisplayValue = function(fieldName, value) {
  if (value === null || value === undefined || value === '') {
    return '<em style="color: var(--text-secondary);">null</em>';
  }

  // Handle timestamp fields for SQLite (Unix timestamps)
  const isTimestampField = window.deviceConfig.timestampPatterns.some(pattern => pattern.test(fieldName));
  
  if (isTimestampField && /^\d{10,13}$/.test(String(value))) {
    // Convert Unix timestamp to readable format
    const timestamp = parseInt(value);
    const date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);
    return `<span title="Unix: ${value}">${date.toLocaleString()}</span>`;
  }

  return String(value);
};

// Helper function to detect ID field using common patterns
window.detectIdField = function(fields) {
  // Find first field matching ID patterns
  for (const pattern of window.deviceConfig.idPatterns) {
    const idField = fields.find(field => pattern.test(field));
    if (idField) return idField;
  }

  // Fallback: return first field (most common case)
  return fields[0];
};

// Helper function to check if a field is an ID field
window.isIdField = function(fieldName, allFields) {
  return fieldName === window.detectIdField(allFields);
};

// Helper function to format SQL values for SQLite
window.formatSqlValue = function(fieldName, value) {
  // Handle null values
  if (value === null || value === 'null' || value === '') {
    return 'NULL';
  }

  // Convert to string and trim
  const stringValue = String(value).trim();

  // Handle timestamp fields (SQLite specific)
  const isTimestampField = window.deviceConfig.timestampPatterns.some(pattern => pattern.test(fieldName));

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

// Clean up function to remove global event listeners
window.cleanup = function() {
  document.removeEventListener('keydown', window.handleGlobalKeyboard);
  window.editingCell = null;
  window.currentFocusedInput = null;
};

console.debug('end: utils.js');