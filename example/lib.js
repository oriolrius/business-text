console.log('loading lib.js');

// SQLite Device Management - Complete Original Code
// This is the EXACT same code from the original dashboard, just moved to an external file

// Move all variables to window
window.currentDataSourceUid = 'sqlite-demo'; // SQLite datasource UID
window.editingCell = null;
window.originalValues = {};
window.tableStructure = null; // Store table structure info
window.currentFocusedInput = null; // Track currently focused input for keyboard navigation

window.loadDevices = async function() {
  try {
    const result = await context.dataSource.sql(window.currentDataSourceUid, 'SELECT * FROM devices ORDER BY id');
    const rows = context.dataSource.utils.toObjects(result);

    if (rows.length === 0) {
      document.getElementById('devices-table').innerHTML = '<p style="color: var(--text-secondary);">No devices found</p>';
      return;
    }

    // Store table structure information for better field handling
    const keys = Object.keys(rows[0]);
    window.tableStructure = {
      fields: keys,
      idField: window.detectIdField(keys), // Better ID field detection
      editableFields: keys.filter(key => !window.isIdField(key, keys)) // Filter out ID fields
    };

    // Get Grafana theme for styling
    const theme = context.grafana.theme;

    // Create scrollable table container with frozen columns
    let html = `
    <div style="
      position: relative; 
      overflow-x: auto; 
      overflow-y: visible;
      border: 1px solid ${theme.colors.border.weak};
      max-width: 100%;
    ">
      <table style="
        width: max-content;
        min-width: 100%;
        border-collapse: collapse;
        background: ${theme.colors.background.primary};
        color: ${theme.colors.text.primary};
        font-family: ${theme.typography.fontFamily};
        font-size: ${theme.typography.body.fontSize};
        table-layout: fixed;
      ">
        <thead>
          <tr style="background: ${theme.colors.primary.main};">
            <!-- Actions column (frozen left) -->
            <th style="
              position: sticky;
              left: 0;
              z-index: 20;
              width: 80px;
              padding: ${theme.spacing(1, 2)};
              border: 1px solid ${theme.colors.border.medium};
              font-weight: ${theme.typography.fontWeightMedium};
              color: ${theme.colors.primary.contrastText};
              text-align: center;
              background: ${theme.colors.primary.main};
              background-clip: padding-box;
              box-shadow: 2px 0 8px rgba(0,0,0,0.2), inset 0 0 0 1000px ${theme.colors.primary.main};
              border-right: 3px solid ${theme.colors.border.strong};
            ">Actions</th>
            
            <!-- Frozen hostname column -->
            <th style="
              position: sticky;
              left: 80px;
              z-index: 19;
              width: 150px;
              padding: ${theme.spacing(1, 2)};
              border: 1px solid ${theme.colors.border.medium};
              font-weight: ${theme.typography.fontWeightMedium};
              color: ${theme.colors.primary.contrastText};
              text-align: left;
              background: ${theme.colors.primary.main};
              background-clip: padding-box;
              box-shadow: 2px 0 8px rgba(0,0,0,0.2), inset 0 0 0 1000px ${theme.colors.primary.main};
              border-right: 3px solid ${theme.colors.border.strong};
            ">hostname</th>
            
            <!-- Frozen ip_address column -->
            <th style="
              position: sticky;
              left: 230px;
              z-index: 18;
              width: 140px;
              padding: ${theme.spacing(1, 2)};
              border: 1px solid ${theme.colors.border.medium};
              font-weight: ${theme.typography.fontWeightMedium};
              color: ${theme.colors.primary.contrastText};
              text-align: left;
              background: ${theme.colors.primary.main};
              background-clip: padding-box;
              box-shadow: 2px 0 8px rgba(0,0,0,0.2), inset 0 0 0 1000px ${theme.colors.primary.main};
              border-right: 3px solid ${theme.colors.border.strong};
            ">ip_address</th>`;

    // Add remaining headers (scrollable)
    window.tableStructure.fields.forEach(key => {
      const isId = key === window.tableStructure.idField;
      const isFrozen = key === 'hostname' || key === 'ip_address';

      // Skip ID column and frozen columns (already added)
      if (isId || isFrozen) return;

      html += `<th style="
        min-width: 120px;
        padding: ${theme.spacing(1, 2)};
        border: 1px solid ${theme.colors.border.medium};
        font-weight: ${theme.typography.fontWeightMedium};
        color: ${theme.colors.primary.contrastText};
        text-align: left;
        background: ${theme.colors.primary.main};
      ">${key}</th>`;
    });

    html += `
          </tr>
        </thead>
        <tbody>`;

    // Add rows with Font Awesome icons and frozen columns
    rows.forEach((row, index) => {
      // Alternate row colors for better readability
      const rowBg = index % 2 === 0 ? theme.colors.background.primary : theme.colors.background.secondary;

      html += `<tr data-row-index="${index}" style="
        background: ${rowBg};
      " onmouseover="
        this.style.background='${theme.colors.action.hover}';
        // Update frozen column backgrounds on hover
        const actionCell = this.children[0];
        const hostnameCell = this.children[1];
        const ipCell = this.children[2];
        if (actionCell) actionCell.style.boxShadow = '2px 0 8px rgba(0,0,0,0.2), inset 0 0 0 1000px ${theme.colors.action.hover}, inset 3px 0 0 ${theme.colors.border.strong}';
        if (hostnameCell) hostnameCell.style.boxShadow = '2px 0 8px rgba(0,0,0,0.2), inset 0 0 0 1000px ${theme.colors.action.hover}, inset 3px 0 0 ${theme.colors.border.strong}';
        if (ipCell) ipCell.style.boxShadow = '2px 0 8px rgba(0,0,0,0.2), inset 0 0 0 1000px ${theme.colors.action.hover}, inset 3px 0 0 ${theme.colors.border.strong}';
      " onmouseout="
        this.style.background='${rowBg}';
        // Restore frozen column backgrounds
        const actionCell = this.children[0];
        const hostnameCell = this.children[1];
        const ipCell = this.children[2];
        if (actionCell) actionCell.style.boxShadow = '2px 0 8px rgba(0,0,0,0.2), inset 0 0 0 1000px ${rowBg}, inset 3px 0 0 ${theme.colors.border.strong}';
        if (hostnameCell) hostnameCell.style.boxShadow = '2px 0 8px rgba(0,0,0,0.2), inset 0 0 0 1000px ${rowBg}, inset 3px 0 0 ${theme.colors.border.strong}';
        if (ipCell) ipCell.style.boxShadow = '2px 0 8px rgba(0,0,0,0.2), inset 0 0 0 1000px ${rowBg}, inset 3px 0 0 ${theme.colors.border.strong}';
      ">`;

      // Get ID value for operations
      const idValue = row[window.tableStructure.idField];

      // Actions column (frozen left)
      html += `<td style="
        position: sticky;
        left: 0;
        z-index: 15;
        width: 80px;
        padding: ${theme.spacing(1)};
        border: 1px solid transparent;
        background: ${rowBg};
        background-clip: padding-box;
        text-align: center;
        box-shadow: 2px 0 8px rgba(0,0,0,0.2), inset 0 0 0 1000px ${rowBg}, inset 3px 0 0 ${theme.colors.border.strong};
        border-right: 3px solid ${theme.colors.border.strong};
      ">
        
        <!-- Edit Icon -->
        <i class="edit-icon fas fa-pen" 
           data-device-id="${idValue}" 
           data-row-index="${index}" 
           style="
             color: ${theme.colors.info.main};
             cursor: pointer;
             font-size: 14px;
             margin-right: 8px;
             padding: 4px;
             border-radius: 3px;
             transition: all 0.2s ease;
           "
           onmouseover="this.style.background='${theme.colors.info.main}15'; this.style.color='${theme.colors.info.shade}'"
           onmouseout="this.style.background='transparent'; this.style.color='${theme.colors.info.main}'"
           title="Edit row"></i>
        
        <!-- Save Icon (hidden initially) -->
        <i class="save-icon fas fa-check" 
           data-device-id="${idValue}" 
           data-row-index="${index}" 
           style="
             color: ${theme.colors.success.main};
             cursor: pointer;
             font-size: 14px;
             margin-right: 4px;
             padding: 4px;
             border-radius: 3px;
             transition: all 0.2s ease;
             display: none;
           "
           onmouseover="this.style.background='${theme.colors.success.main}15'; this.style.color='${theme.colors.success.shade}'"
           onmouseout="this.style.background='transparent'; this.style.color='${theme.colors.success.main}'"
           title="Save changes"></i>
        
        <!-- Cancel Icon (hidden initially) -->
        <i class="cancel-icon fas fa-times" 
           data-device-id="${idValue}" 
           data-row-index="${index}" 
           style="
             color: ${theme.colors.warning.main};
             cursor: pointer;
             font-size: 14px;
             margin-right: 4px;
             padding: 4px;
             border-radius: 3px;
             transition: all 0.2s ease;
             display: none;
           "
           onmouseover="this.style.background='${theme.colors.warning.main}15'; this.style.color='${theme.colors.warning.shade}'"
           onmouseout="this.style.background='transparent'; this.style.color='${theme.colors.warning.main}'"
           title="Cancel edit"></i>
        
        <!-- Delete Icon -->
        <i class="delete-icon fas fa-trash" 
           data-device-id="${idValue}" 
           data-row-index="${index}" 
           style="
             color: ${theme.colors.error.main};
             cursor: pointer;
             font-size: 14px;
             padding: 4px;
             border-radius: 3px;
             transition: all 0.2s ease;
           "
           onmouseover="this.style.background='${theme.colors.error.main}15'; this.style.color='${theme.colors.error.shade}'"
           onmouseout="this.style.background='transparent'; this.style.color='${theme.colors.error.main}'"
           title="Delete row"></i>
      </td>`;

      // Frozen hostname column
      const hostnameValue = row['hostname'] || '';
      const hostnameKey = 'hostname';
      const hostnameCellId = `cell-${index}-hostname`;
      window.originalValues[hostnameCellId] = hostnameValue;

      html += `<td class="editable-cell" 
                   data-field="${hostnameKey}" 
                   data-cell-id="${hostnameCellId}" 
                   data-row-index="${index}"
                   data-original-value="${hostnameValue}"
                   style="
        position: sticky;
        left: 80px;
        z-index: 14;
        width: 150px;
        padding: ${theme.spacing(1, 2)};
        border: 1px solid transparent;
        color: ${theme.colors.text.primary};
        cursor: pointer;
        background: ${rowBg};
        background-clip: padding-box;
        box-shadow: 2px 0 8px rgba(0,0,0,0.2), inset 0 0 0 1000px ${rowBg}, inset 3px 0 0 ${theme.colors.border.strong};
        border-right: 3px solid ${theme.colors.border.strong};
      "
         title="Click to edit">${hostnameValue}</td>`;

      // Frozen ip_address column
      const ipValue = row['ip_address'] || '';
      const ipKey = 'ip_address';
      const ipCellId = `cell-${index}-ip_address`;
      window.originalValues[ipCellId] = ipValue;

      html += `<td class="editable-cell" 
                   data-field="${ipKey}" 
                   data-cell-id="${ipCellId}" 
                   data-row-index="${index}"
                   data-original-value="${ipValue}"
                   style="
        position: sticky;
        left: 230px;
        z-index: 13;
        width: 140px;
        padding: ${theme.spacing(1, 2)};
        border: 1px solid transparent;
        color: ${theme.colors.text.primary};
        cursor: pointer;
        background: ${rowBg};
        background-clip: padding-box;
        box-shadow: 2px 0 8px rgba(0,0,0,0.2), inset 0 0 0 1000px ${rowBg}, inset 3px 0 0 ${theme.colors.border.strong};
        border-right: 3px solid ${theme.colors.border.strong};
      "
         title="Click to edit">${ipValue}</td>`;

      // Add remaining scrollable columns
      window.tableStructure.fields.forEach((key, keyIndex) => {
        const isIdField = key === window.tableStructure.idField;
        const isFrozen = key === 'hostname' || key === 'ip_address';

        // Skip ID and frozen columns (already handled)
        if (isIdField || isFrozen) return;

        const cellId = `cell-${index}-${keyIndex}`;
        window.originalValues[cellId] = row[key];
        const isEditable = !isIdField;

        html += `<td class="${isEditable ? 'editable-cell' : 'id-cell'}" 
                     data-field="${key}" 
                     data-cell-id="${cellId}" 
                     data-row-index="${index}"
                     data-field-index="${keyIndex}"
                     data-original-value="${row[key]}"
                     style="
          min-width: 120px;
          padding: ${theme.spacing(1, 2)};
          border: 1px solid ${theme.colors.border.weak};
          color: ${theme.colors.text.primary};
          cursor: ${isEditable ? 'pointer' : 'default'};
          position: relative;
        " ${isEditable ? 'title="Click to edit"' : ''}>${window.formatDisplayValue(key, row[key])}</td>`;
      });

      html += '</tr>';
    });

    html += `
        </tbody>
      </table>
    </div>`;

    document.getElementById('devices-table').innerHTML = html;

    // Add event listeners
    window.addEventListeners();

  } catch (error) {
    const theme = context.grafana.theme;
    document.getElementById('devices-table').innerHTML = `
      <div style="
        padding: ${theme.spacing(2)};
        background: ${theme.colors.error.main}15;
        border: 1px solid ${theme.colors.error.main};
        border-radius: ${theme.shape.borderRadius(1)}px;
        color: ${theme.colors.error.text};
        font-family: ${theme.typography.fontFamily};
      ">
        <strong>SQLite Error:</strong> ${error.message}
      </div>`;
  }
};

// Helper function to format display values (especially timestamps)
window.formatDisplayValue = function(fieldName, value) {
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

// Helper function to detect ID field using common patterns
window.detectIdField = function(fields) {
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

window.addEventListeners = function() {
  const theme = context.grafana.theme;

  // Edit icon listeners
  document.querySelectorAll('.edit-icon').forEach(icon => {
    icon.addEventListener('click', function () {
      const rowIndex = this.getAttribute('data-row-index');
      window.enterEditMode(rowIndex);
    });
  });

  // Save icon listeners
  document.querySelectorAll('.save-icon').forEach(icon => {
    icon.addEventListener('click', async function () {
      const deviceId = this.getAttribute('data-device-id');
      const rowIndex = this.getAttribute('data-row-index');
      await window.saveRow(deviceId, rowIndex);
    });
  });

  // Cancel icon listeners
  document.querySelectorAll('.cancel-icon').forEach(icon => {
    icon.addEventListener('click', function () {
      const rowIndex = this.getAttribute('data-row-index');
      window.cancelEdit(rowIndex);
    });
  });

  // Delete icon listeners
  document.querySelectorAll('.delete-icon').forEach(icon => {
    icon.addEventListener('click', async function () {
      const deviceId = this.getAttribute('data-device-id');
      await window.deleteDevice(deviceId, this);
    });
  });

  // Cell click listeners for inline editing
  document.querySelectorAll('.editable-cell').forEach(cell => {
    cell.addEventListener('click', function () {
      const rowIndex = this.getAttribute('data-row-index');
      if (window.editingCell === null) {
        window.enterEditMode(rowIndex);
        window.makeInlineEditable(this);
      }
    });
  });

  // Add keyboard navigation support
  document.addEventListener('keydown', window.handleGlobalKeyboard);
};

// Global keyboard handler for navigation and shortcuts
window.handleGlobalKeyboard = function(e) {
  // Only handle keyboard events during editing
  if (window.editingCell === null) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    window.cancelEdit(window.editingCell);
  }

  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    const row = document.querySelector(`tr[data-row-index="${window.editingCell}"]`);
    const saveIcon = row.querySelector('.save-icon');
    if (saveIcon && saveIcon.style.display !== 'none') {
      saveIcon.click();
    }
  }
};

window.enterEditMode = function(rowIndex) {
  if (window.editingCell !== null) {
    context.grafana.notifyError(['Edit Error', 'Please save or cancel current edit before editing another row']);
    return;
  }

  const row = document.querySelector(`tr[data-row-index="${rowIndex}"]`);
  const editIcon = row.querySelector('.edit-icon');
  const saveIcon = row.querySelector('.save-icon');
  const cancelIcon = row.querySelector('.cancel-icon');

  // Toggle icon visibility
  editIcon.style.display = 'none';
  saveIcon.style.display = 'inline-block';
  cancelIcon.style.display = 'inline-block';

  // Store current values before making cells editable
  const cells = row.querySelectorAll('.editable-cell');
  cells.forEach(cell => {
    const cellId = cell.getAttribute('data-cell-id');
    const currentValue = cell.textContent.trim();
    window.originalValues[cellId] = currentValue;
  });

  // Make cells editable
  cells.forEach(cell => {
    window.makeInlineEditable(cell);
  });

  window.editingCell = rowIndex;
};

window.makeInlineEditable = function(cell) {
  const theme = context.grafana.theme;
  const cellId = cell.getAttribute('data-cell-id');
  const fieldName = cell.getAttribute('data-field');
  const rowIndex = cell.getAttribute('data-row-index');
  
  // Get original value
  let originalValue = cell.getAttribute('data-original-value');
  if (!originalValue) {
    originalValue = window.originalValues[cellId];
  }
  if (originalValue === undefined || originalValue === null) {
    originalValue = cell.textContent.trim();
  }
  if (!originalValue) {
    originalValue = '';
  }

  // Skip ID field editing
  if (fieldName === window.tableStructure.idField) {
    context.grafana.notifyError(['Field Error', 'ID field cannot be edited']);
    return;
  }

  // Create input with better styling
  const input = document.createElement('input');
  input.type = 'text';
  input.value = originalValue;
  input.setAttribute('data-original-value', originalValue);
  input.setAttribute('data-field', fieldName);

  // Add placeholder for timestamp fields
  const timestampPatterns = [
    /.*_at$/i, /.*_time$/i, /.*timestamp$/i, /^date$/i, /^time$/i
  ];
  const isTimestampField = timestampPatterns.some(pattern => pattern.test(fieldName));

  if (isTimestampField) {
    input.placeholder = 'e.g., 1671234567 (Unix) or 2023-12-17T10:30:00Z (ISO)';
    input.title = 'Enter Unix timestamp or ISO date format';
  }

  input.style.cssText = `
    width: 100%;
    background: ${theme.colors.background.canvas};
    border: 1px solid ${theme.colors.border.medium};
    color: ${theme.colors.text.primary};
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.fontSize};
    padding: ${theme.spacing(1)};
    border-radius: ${theme.shape.radius.default}px;
    box-sizing: border-box;
    outline: none;
    transition: all 0.2s ease;
    box-shadow: none;
  `;

  // Enhanced keyboard navigation and input handling
  input.addEventListener('keydown', function (e) {
    window.handleInputKeyboard(e, cell, input);
  });

  input.addEventListener('focus', function () {
    window.currentFocusedInput = input;
    this.style.borderColor = theme.colors.primary.border;
    this.style.boxShadow = `0 0 0 2px ${theme.colors.primary.transparent}`;
  });

  input.addEventListener('blur', function () {
    this.style.borderColor = theme.colors.border.medium;
    this.style.boxShadow = 'none';
  });

  // Validate input on change
  input.addEventListener('input', function () {
    window.validateInput(input, theme);
  });

  cell.innerHTML = '';
  cell.appendChild(input);
  input.focus();
  input.select();
  window.currentFocusedInput = input;
};

// Enhanced keyboard handling for input fields
window.handleInputKeyboard = function(e, cell, input) {
  switch (e.key) {
    case 'Enter':
      e.preventDefault();
      const nextCell = window.getNextEditableCell(cell);
      if (nextCell) {
        window.makeInlineEditable(nextCell);
      } else {
        // If last cell, save the row
        const row = cell.closest('tr');
        const saveIcon = row.querySelector('.save-icon');
        if (saveIcon && saveIcon.style.display !== 'none') {
          saveIcon.click();
        }
      }
      break;

    case 'Tab':
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Tab: Move to previous editable cell
        const prevCell = window.getPreviousEditableCell(cell);
        if (prevCell) {
          window.makeInlineEditable(prevCell);
        }
      } else {
        // Tab: Move to next editable cell
        const nextCell = window.getNextEditableCell(cell);
        if (nextCell) {
          window.makeInlineEditable(nextCell);
        }
      }
      break;

    case 'Escape':
      e.preventDefault();
      window.cancelEdit(window.editingCell);
      break;
  }
};

// Input validation with visual feedback
window.validateInput = function(input, theme) {
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

window.getNextEditableCell = function(currentCell) {
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
        if (nextRowIndex !== window.editingCell) {
          window.cancelEdit(window.editingCell);
          window.enterEditMode(nextRowIndex);
          return firstEditableCell;
        }
      }
    }
  }
  return null;
};

window.getPreviousEditableCell = function(currentCell) {
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
        if (prevRowIndex !== window.editingCell) {
          window.cancelEdit(window.editingCell);
          window.enterEditMode(prevRowIndex);
          return lastEditableCell;
        }
      }
    }
  }
  return null;
};

window.saveRow = async function(deviceId, rowIndex) {
  const theme = context.grafana.theme;
  const row = document.querySelector(`tr[data-row-index="${rowIndex}"]`);
  const cells = row.querySelectorAll('.editable-cell');

  // Collect updated data from editable fields only
  const updatedData = {};
  const changes = {};
  let hasChanges = false;
  let hasValidationErrors = false;

  cells.forEach(cell => {
    const fieldName = cell.getAttribute('data-field');
    const cellId = cell.getAttribute('data-cell-id');
    let newValue;

    const input = cell.querySelector('input');
    if (input) {
      newValue = input.value.trim();

      // Use the enhanced validation function
      if (!window.validateInput(input, theme)) {
        hasValidationErrors = true;
        return;
      }
    } else {
      newValue = cell.textContent.trim();
    }

    updatedData[fieldName] = newValue;

    // Check for changes
    if (window.originalValues[cellId] !== newValue) {
      hasChanges = true;
      changes[fieldName] = {
        old: window.originalValues[cellId],
        new: newValue
      };
    }
  });

  if (hasValidationErrors) {
    context.grafana.notifyError(['Validation Error', 'Please fix validation errors before saving']);
    return;
  }

  if (!hasChanges) {
    window.exitEditMode(rowIndex);
    context.grafana.notifySuccess(['Save Status', 'No changes to save']);
    return;
  }

  try {
    // Build UPDATE SQL query for SQLite with only changed fields
    const updates = Object.keys(changes)
      .map(key => {
        const newValue = changes[key].new;
        return `${key} = ${window.formatSqlValue(key, newValue)}`;
      })
      .join(', ');

    const updateSql = `UPDATE devices SET ${updates} WHERE ${window.tableStructure.idField} = ${deviceId}`;

    // Show saving state
    const saveIcon = row.querySelector('.save-icon');
    const originalSaveClass = saveIcon.className;
    saveIcon.className = 'save-icon fas fa-spinner fa-spin';
    saveIcon.style.pointerEvents = 'none';
    saveIcon.title = 'Saving to SQLite...';

    console.log('Executing SQLite UPDATE:', updateSql);

    // Execute UPDATE SQL using SQLite
    await context.dataSource.sql(window.currentDataSourceUid, updateSql);

    // Update UI with new values and reset original values
    cells.forEach(cell => {
      const fieldName = cell.getAttribute('data-field');
      const cellId = cell.getAttribute('data-cell-id');
      const newValue = updatedData[fieldName];

      cell.innerHTML = window.formatDisplayValue(fieldName, newValue);
      window.originalValues[cellId] = newValue; // Update stored original values
    });

    // Restore save icon before exiting edit mode
    saveIcon.className = originalSaveClass;
    saveIcon.style.pointerEvents = 'auto';
    saveIcon.title = 'Save changes';

    window.exitEditMode(rowIndex);

    // Show detailed success message
    const changedFields = Object.keys(changes).join(', ');
    context.grafana.notifySuccess(['Update Success', `SQLite device updated successfully. Changed: ${changedFields}`]);

  } catch (error) {
    // Re-enable save icon on error
    const saveIcon = row.querySelector('.save-icon');
    saveIcon.className = originalSaveClass;
    saveIcon.style.pointerEvents = 'auto';
    saveIcon.title = 'Save changes';

    // Enhanced error handling for SQLite
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
              console.error('Failed SQLite Query:', executedQuery);
              errorDetails += `Query: ${executedQuery.substring(0, 100)}${executedQuery.length > 100 ? '...' : ''}`;
            }
          }
        }
      });
    }

    // Show comprehensive error notification
    const fullErrorMessage = `SQLite update failed: ${errorMessage}${errorDetails ? ' | ' + errorDetails : ''}`;
    context.grafana.notifyError(['Update Error', fullErrorMessage]);

    console.error('SQLite save operation failed:', {
      originalError: error,
      processedMessage: fullErrorMessage,
      deviceId: deviceId,
      changes: changes
    });
  }
};

window.cancelEdit = function(rowIndex) {
  const row = document.querySelector(`tr[data-row-index="${rowIndex}"]`);
  const cells = row.querySelectorAll('.editable-cell');

  // Restore original values
  cells.forEach(cell => {
    const cellId = cell.getAttribute('data-cell-id');
    const fieldName = cell.getAttribute('data-field');
    const originalValue = window.originalValues[cellId];
    cell.innerHTML = window.formatDisplayValue(fieldName, originalValue);
  });

  window.exitEditMode(rowIndex);
  context.grafana.notifySuccess(['Edit Cancelled', 'Edit cancelled']);
};

window.exitEditMode = function(rowIndex) {
  const row = document.querySelector(`tr[data-row-index="${rowIndex}"]`);
  const editIcon = row.querySelector('.edit-icon');
  const saveIcon = row.querySelector('.save-icon');
  const cancelIcon = row.querySelector('.cancel-icon');

  // Toggle icon visibility
  editIcon.style.display = 'inline-block';
  saveIcon.style.display = 'none';
  cancelIcon.style.display = 'none';

  // Reset save icon to original state (in case it was a spinner)
  saveIcon.className = 'save-icon fas fa-check';
  saveIcon.style.pointerEvents = 'auto';
  saveIcon.title = 'Save changes';

  // Clean up state
  window.editingCell = null;
  window.currentFocusedInput = null;
};

window.deleteDevice = async function(deviceId, iconElement) {
  if (!confirm(`Are you sure you want to delete device ${deviceId}?`)) {
    return;
  }

  const theme = context.grafana.theme;

  // Disable icon during delete
  const originalClass = iconElement.className;
  iconElement.className = 'delete-icon fas fa-spinner fa-spin';
  iconElement.style.pointerEvents = 'none';
  iconElement.title = 'Deleting from SQLite...';

  try {
    // Execute DELETE SQL using SQLite syntax
    const deleteSql = `DELETE FROM devices WHERE ${window.tableStructure.idField} = ${deviceId}`;
    console.log('Executing SQLite DELETE:', deleteSql);
    
    await context.dataSource.sql(window.currentDataSourceUid, deleteSql);

    // Remove the row from table with smooth animation
    const row = iconElement.closest('tr');
    row.style.transition = 'opacity 0.3s ease';
    row.style.opacity = '0';
    setTimeout(() => row.remove(), 300);

    // Show success notification
    context.grafana.notifySuccess(['Delete Success', `SQLite device ${deviceId} deleted successfully`]);

  } catch (error) {
    // Re-enable icon on error
    iconElement.className = originalClass;
    iconElement.style.pointerEvents = 'auto';
    iconElement.title = 'Delete row';

    // Enhanced error handling for delete operation
    let errorMessage = 'Unknown error occurred';

    if (error && error.message) {
      errorMessage = error.message;
    }

    // Check for database-specific errors
    if (error && error.data && error.data.results) {
      const results = error.data.results;
      Object.keys(results).forEach(key => {
        const result = results[key];
        if (result.error) {
          errorMessage = result.error;
        }
      });
    }

    // Show comprehensive error notification
    const fullErrorMessage = `SQLite delete failed: ${errorMessage}`;
    context.grafana.notifyError(['Delete Error', fullErrorMessage]);

    console.error('SQLite delete operation failed:', {
      originalError: error,
      processedMessage: fullErrorMessage,
      deviceId: deviceId
    });
  }
};

// Clean up function to remove global event listeners
window.cleanup = function() {
  document.removeEventListener('keydown', window.handleGlobalKeyboard);
  window.editingCell = null;
  window.currentFocusedInput = null;
};

// Initialize when DOM is ready
window.initializeDeviceManagement = function() {
  console.log('🚀 Initializing Device Management...');
  
  // Ensure FontAwesome is loaded
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    fontAwesome.integrity = 'sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==';
    fontAwesome.crossOrigin = 'anonymous';
    fontAwesome.referrerPolicy = 'no-referrer';
    document.head.appendChild(fontAwesome);
    console.log('📦 FontAwesome CSS added as fallback');
  }
  
  const loadButton = document.getElementById('load-devices');
  if (!loadButton) {
    console.error('❌ Load button not found, retrying...');
    setTimeout(window.initializeDeviceManagement, 100);
    return;
  }

  // Remove any existing listeners
  loadButton.removeEventListener('click', window.loadDevices);
  
  // Add click event listener
  loadButton.addEventListener('click', function(e) {
    console.log('📱 Load devices button clicked');
    e.preventDefault();
    window.loadDevices();
  });
  
  console.log('✅ Device Management initialized, button ready');
};

console.log('END: lib.js');
