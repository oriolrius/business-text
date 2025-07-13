let currentDataSourceUid = 'cerq98n76ap6od'; // Replace with your actual data source UID
let editingCell = null;
let originalValues = {};
let tableStructure = null; // Store table structure info
let currentFocusedInput = null; // Track currently focused input for keyboard navigation

document.getElementById('load-devices').addEventListener('click', loadDevices);

async function loadDevices() {
  try {
    const result = await context.dataSource.sql(currentDataSourceUid, 'SELECT * FROM devices');
    const rows = context.dataSource.utils.toObjects(result);

    if (rows.length === 0) {
      document.getElementById('devices-table').innerHTML = '<p style="color: var(--text-secondary);">No devices found</p>';
      return;
    }

    // Store table structure information for better field handling
    const keys = Object.keys(rows[0]);
    tableStructure = {
      fields: keys,
      idField: detectIdField(keys), // Better ID field detection
      editableFields: keys.filter(key => !isIdField(key, keys)) // Filter out ID fields
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
              z-index: 10;
              width: 80px;
              padding: ${theme.spacing(1, 2)};
              border: 1px solid ${theme.colors.border.medium};
              font-weight: ${theme.typography.fontWeightMedium};
              color: ${theme.colors.primary.contrastText};
              text-align: center;
              background: ${theme.colors.primary.main};
              box-shadow: 2px 0 4px rgba(0,0,0,0.1);
            ">Actions</th>
            
            <!-- Frozen hostname column -->
            <th style="
              position: sticky;
              left: 80px;
              z-index: 9;
              width: 150px;
              padding: ${theme.spacing(1, 2)};
              border: 1px solid ${theme.colors.border.medium};
              font-weight: ${theme.typography.fontWeightMedium};
              color: ${theme.colors.primary.contrastText};
              text-align: left;
              background: ${theme.colors.primary.main};
              box-shadow: 2px 0 4px rgba(0,0,0,0.1);
            ">hostname</th>
            
            <!-- Frozen ip_address column -->
            <th style="
              position: sticky;
              left: 230px;
              z-index: 8;
              width: 140px;
              padding: ${theme.spacing(1, 2)};
              border: 1px solid ${theme.colors.border.medium};
              font-weight: ${theme.typography.fontWeightMedium};
              color: ${theme.colors.primary.contrastText};
              text-align: left;
              background: ${theme.colors.primary.main};
              box-shadow: 2px 0 4px rgba(0,0,0,0.1);
            ">ip_address</th>`;

    // Add remaining headers (scrollable)
    tableStructure.fields.forEach(key => {
      const isId = key === tableStructure.idField;
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
      const rowBg = index % 2 === 0 ? theme.colors.background.primary : 'rgba(204, 204, 220, 0.05)';

      html += `<tr data-row-index="${index}" style="
        background: ${rowBg};
      " onmouseover="this.style.background='${theme.colors.action.hover}'" 
         onmouseout="this.style.background='${rowBg}'">`;

      // Get ID value for operations
      const idValue = row[tableStructure.idField];

      // Actions column (frozen left)
      html += `<td style="
        position: sticky;
        left: 0;
        z-index: 5;
        width: 80px;
        padding: ${theme.spacing(1)};
        border: 1px solid ${theme.colors.border.weak};
        background: ${rowBg};
        text-align: center;
        box-shadow: 2px 0 4px rgba(0,0,0,0.1);
      " onmouseover="this.style.background='${theme.colors.action.hover}'" 
         onmouseout="this.style.background='${rowBg}'">
        
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
      originalValues[hostnameCellId] = hostnameValue;
      
      html += `<td class="editable-cell" 
                   data-field="${hostnameKey}" 
                   data-cell-id="${hostnameCellId}" 
                   data-row-index="${index}"
                   style="
        position: sticky;
        left: 80px;
        z-index: 4;
        width: 150px;
        padding: ${theme.spacing(1, 2)};
        border: 1px solid ${theme.colors.border.weak};
        color: ${theme.colors.text.primary};
        cursor: pointer;
        background: ${rowBg};
        box-shadow: 2px 0 4px rgba(0,0,0,0.1);
      " onmouseover="this.style.background='${theme.colors.action.hover}'" 
         onmouseout="this.style.background='${rowBg}'"
         title="Click to edit">${hostnameValue}</td>`;

      // Frozen ip_address column
      const ipValue = row['ip_address'] || '';
      const ipKey = 'ip_address';
      const ipCellId = `cell-${index}-ip_address`;
      originalValues[ipCellId] = ipValue;
      
      html += `<td class="editable-cell" 
                   data-field="${ipKey}" 
                   data-cell-id="${ipCellId}" 
                   data-row-index="${index}"
                   style="
        position: sticky;
        left: 230px;
        z-index: 3;
        width: 140px;
        padding: ${theme.spacing(1, 2)};
        border: 1px solid ${theme.colors.border.weak};
        color: ${theme.colors.text.primary};
        cursor: pointer;
        background: ${rowBg};
        box-shadow: 2px 0 4px rgba(0,0,0,0.1);
      " onmouseover="this.style.background='${theme.colors.action.hover}'" 
         onmouseout="this.style.background='${rowBg}'"
         title="Click to edit">${ipValue}</td>`;

      // Add remaining scrollable columns
      tableStructure.fields.forEach((key, keyIndex) => {
        const isIdField = key === tableStructure.idField;
        const isFrozen = key === 'hostname' || key === 'ip_address';
        
        // Skip ID and frozen columns (already handled)
        if (isIdField || isFrozen) return;
        
        const cellId = `cell-${index}-${keyIndex}`;
        originalValues[cellId] = row[key];
        const isEditable = !isIdField;
        
        html += `<td class="${isEditable ? 'editable-cell' : 'id-cell'}" 
                     data-field="${key}" 
                     data-cell-id="${cellId}" 
                     data-row-index="${index}"
                     data-field-index="${keyIndex}"
                     style="
          min-width: 120px;
          padding: ${theme.spacing(1, 2)};
          border: 1px solid ${theme.colors.border.weak};
          color: ${theme.colors.text.primary};
          cursor: ${isEditable ? 'pointer' : 'default'};
          position: relative;
        " ${isEditable ? 'title="Click to edit"' : ''}>${row[key]}</td>`;
      });

      html += '</tr>';
    });

    html += `
        </tbody>
      </table>
    </div>
    
    <!-- Font Awesome CSS (if not already included) -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer">
    `;

    document.getElementById('devices-table').innerHTML = html;

    // Add event listeners
    addEventListeners();

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
        <strong>Error:</strong> ${error.message}
      </div>`;
  }
}

// Helper function to detect ID field using common patterns
function detectIdField(fields) {
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
}

// Helper function to check if a field is an ID field
function isIdField(fieldName, allFields) {
  return fieldName === detectIdField(allFields);
}

// Helper function to format SQL values based on field type and content
function formatSqlValue(fieldName, value) {
  // Handle null values
  if (value === null || value === 'null' || value === '') {
    return 'NULL';
  }
  
  // Convert to string and trim
  const stringValue = String(value).trim();
  
  // Handle timestamp fields (common patterns)
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
      // Convert Unix timestamp to PostgreSQL timestamp
      const timestamp = parseInt(stringValue);
      const date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);
      
      if (isNaN(date.getTime())) {
        return 'NULL';
      }
      
      // Format as PostgreSQL timestamp
      return `'${date.toISOString()}'`;
    }
    
    // Check if it's already a valid date string
    const parsedDate = new Date(stringValue);
    if (!isNaN(parsedDate.getTime())) {
      return `'${parsedDate.toISOString()}'`;
    }
    
    // If we can't parse it as a date, treat it as NULL
    return 'NULL';
  }
  
  // Handle numeric fields
  if (/^\-?\d+(\.\d+)?$/.test(stringValue)) {
    return stringValue; // No quotes for numbers
  }
  
  // Handle boolean fields
  if (stringValue.toLowerCase() === 'true' || stringValue.toLowerCase() === 'false') {
    return stringValue.toLowerCase();
  }
  
  // Default: treat as string with proper escaping
  return `'${stringValue.replace(/'/g, "''")}'`;
}

function addEventListeners() {
  const theme = context.grafana.theme;

  // Edit icon listeners
  document.querySelectorAll('.edit-icon').forEach(icon => {
    icon.addEventListener('click', function() {
      const rowIndex = this.getAttribute('data-row-index');
      enterEditMode(rowIndex);
    });
  });

  // Save icon listeners
  document.querySelectorAll('.save-icon').forEach(icon => {
    icon.addEventListener('click', async function() {
      const deviceId = this.getAttribute('data-device-id');
      const rowIndex = this.getAttribute('data-row-index');
      await saveRow(deviceId, rowIndex);
    });
  });

  // Cancel icon listeners
  document.querySelectorAll('.cancel-icon').forEach(icon => {
    icon.addEventListener('click', function() {
      const rowIndex = this.getAttribute('data-row-index');
      cancelEdit(rowIndex);
    });
  });

  // Delete icon listeners
  document.querySelectorAll('.delete-icon').forEach(icon => {
    icon.addEventListener('click', async function() {
      const deviceId = this.getAttribute('data-device-id');
      await deleteDevice(deviceId, this);
    });
  });

  // Cell click listeners for inline editing
  document.querySelectorAll('.editable-cell').forEach(cell => {
    cell.addEventListener('click', function() {
      const rowIndex = this.getAttribute('data-row-index');
      if (editingCell === null) {
        enterEditMode(rowIndex);
        makeInlineEditable(this);
      }
    });
  });

  // Add keyboard navigation support
  document.addEventListener('keydown', handleGlobalKeyboard);
}

// Global keyboard handler for navigation and shortcuts
function handleGlobalKeyboard(e) {
  // Only handle keyboard events during editing
  if (editingCell === null) return;
  
  if (e.key === 'Escape') {
    e.preventDefault();
    cancelEdit(editingCell);
  }
  
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    const row = document.querySelector(`tr[data-row-index="${editingCell}"]`);
    const saveIcon = row.querySelector('.save-icon');
    if (saveIcon && saveIcon.style.display !== 'none') {
      saveIcon.click();
    }
  }
}

function enterEditMode(rowIndex) {
  if (editingCell !== null) {
    context.grafana.notifyWarning('Please save or cancel current edit before editing another row');
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

  // Make cells editable
  const cells = row.querySelectorAll('.editable-cell');
  cells.forEach(cell => {
    makeInlineEditable(cell);
  });

  editingCell = rowIndex;
}

function makeInlineEditable(cell) {
  const theme = context.grafana.theme;
  const originalValue = cell.textContent;
  const fieldName = cell.getAttribute('data-field');
  
  // Skip ID field editing
  if (fieldName === tableStructure.idField) {
    context.grafana.notifyWarning('ID field cannot be edited');
    return;
  }

  // Create input with better styling and attributes
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
    background: ${theme.colors.background.secondary};
    border: 2px solid ${theme.colors.primary.main};
    color: ${theme.colors.text.primary};
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.body.fontSize};
    padding: ${theme.spacing(0.5)};
    border-radius: ${theme.shape.borderRadius(1)}px;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.2s ease;
  `;

  // Enhanced keyboard navigation and input handling
  input.addEventListener('keydown', function(e) {
    handleInputKeyboard(e, cell, input);
  });
  
  input.addEventListener('focus', function() {
    currentFocusedInput = input;
    this.style.borderColor = theme.colors.primary.main;
  });
  
  input.addEventListener('blur', function() {
    this.style.borderColor = theme.colors.border.medium;
  });
  
  // Validate input on change
  input.addEventListener('input', function() {
    validateInput(input, theme);
  });

  cell.innerHTML = '';
  cell.appendChild(input);
  input.focus();
  input.select();
  currentFocusedInput = input;
}

// Enhanced keyboard handling for input fields
function handleInputKeyboard(e, cell, input) {
  switch(e.key) {
    case 'Enter':
      e.preventDefault();
      const nextCell = getNextEditableCell(cell);
      if (nextCell) {
        makeInlineEditable(nextCell);
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
        const prevCell = getPreviousEditableCell(cell);
        if (prevCell) {
          makeInlineEditable(prevCell);
        }
      } else {
        // Tab: Move to next editable cell
        const nextCell = getNextEditableCell(cell);
        if (nextCell) {
          makeInlineEditable(nextCell);
        }
      }
      break;
      
    case 'Escape':
      e.preventDefault();
      cancelEdit(editingCell);
      break;
  }
}

// Input validation with visual feedback
function validateInput(input, theme) {
  const value = input.value.trim();
  const fieldName = input.getAttribute('data-field');
  
  // Basic validation - can be extended based on field type
  if (value === '') {
    input.style.borderColor = theme.colors.warning.main;
    input.title = 'Field cannot be empty';
    return false;
  }
  
  // Validate timestamp fields
  const timestampPatterns = [
    /.*_at$/i,        // ends with "_at": created_at, updated_at, last_seen_at
    /.*_time$/i,      // ends with "_time": start_time, end_time
    /.*timestamp$/i,  // ends with "timestamp"
    /^date$/i,        // exact: "date"
    /^time$/i         // exact: "time"
  ];
  
  const isTimestampField = timestampPatterns.some(pattern => pattern.test(fieldName));
  
  if (isTimestampField) {
    // Check if it's a valid Unix timestamp
    if (/^\d{10,13}$/.test(value)) {
      const timestamp = parseInt(value);
      const date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);
      
      if (isNaN(date.getTime())) {
        input.style.borderColor = theme.colors.error.main;
        input.title = 'Invalid timestamp format';
        return false;
      }
      
      // Show parsed date in tooltip for validation
      input.title = `Will be saved as: ${date.toISOString()}`;
      input.style.borderColor = theme.colors.success.main;
      return true;
    }
    
    // Check if it's a valid date string
    const parsedDate = new Date(value);
    if (!isNaN(parsedDate.getTime())) {
      input.title = `Will be saved as: ${parsedDate.toISOString()}`;
      input.style.borderColor = theme.colors.success.main;
      return true;
    }
    
    // Invalid timestamp format
    input.style.borderColor = theme.colors.error.main;
    input.title = 'Invalid date/time format. Use Unix timestamp (e.g., 1671234567) or ISO date (e.g., 2023-12-17T10:30:00Z)';
    return false;
  }
  
  // Default validation passed
  input.style.borderColor = theme.colors.primary.main;
  input.title = '';
  return true;
}

function getNextEditableCell(currentCell) {
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
        if (nextRowIndex !== editingCell) {
          cancelEdit(editingCell);
          enterEditMode(nextRowIndex);
          return firstEditableCell;
        }
      }
    }
  }
  return null;
}

function getPreviousEditableCell(currentCell) {
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
        if (prevRowIndex !== editingCell) {
          cancelEdit(editingCell);
          enterEditMode(prevRowIndex);
          return lastEditableCell;
        }
      }
    }
  }
  return null;
}

async function saveRow(deviceId, rowIndex) {
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
      if (!validateInput(input, theme)) {
        hasValidationErrors = true;
        return;
      }
    } else {
      newValue = cell.textContent.trim();
    }
    
    updatedData[fieldName] = newValue;
    
    // Check for changes
    if (originalValues[cellId] !== newValue) {
      hasChanges = true;
      changes[fieldName] = {
        old: originalValues[cellId],
        new: newValue
      };
    }
  });

  if (hasValidationErrors) {
    context.grafana.notifyWarning('Please fix validation errors before saving');
    return;
  }

  if (!hasChanges) {
    exitEditMode(rowIndex);
    context.grafana.notifyInfo('No changes to save');
    return;
  }

  try {
    // Build UPDATE SQL query with only changed fields and proper data type handling
    const updates = Object.keys(changes)
      .map(key => {
        const newValue = changes[key].new;
        return `${key} = ${formatSqlValue(key, newValue)}`;
      })
      .join(', ');
    
    const updateSql = `UPDATE devices SET ${updates} WHERE ${tableStructure.idField} = '${deviceId}'`;
    
    // Show saving state
    const saveIcon = row.querySelector('.save-icon');
    const originalSaveClass = saveIcon.className;
    saveIcon.className = 'save-icon fas fa-spinner fa-spin';
    saveIcon.style.pointerEvents = 'none';
    saveIcon.title = 'Saving...';
    
    // Execute UPDATE SQL
    await context.dataSource.sql(currentDataSourceUid, updateSql);
    
    // Update UI with new values and reset original values
    cells.forEach(cell => {
      const fieldName = cell.getAttribute('data-field');
      const cellId = cell.getAttribute('data-cell-id');
      const newValue = updatedData[fieldName];
      
      cell.innerHTML = newValue;
      originalValues[cellId] = newValue; // Update stored original values
    });
    
    exitEditMode(rowIndex);
    
    // Show detailed success message
    const changedFields = Object.keys(changes).join(', ');
    context.grafana.notifySuccess(`Device ${deviceId} updated successfully. Changed: ${changedFields}`);
    
  } catch (error) {
    // Re-enable save icon on error
    const saveIcon = row.querySelector('.save-icon');
    saveIcon.className = originalSaveClass;
    saveIcon.style.pointerEvents = 'auto';
    saveIcon.title = 'Save changes';
    
    // Parse and display detailed error information
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
              console.error('Failed SQL Query:', executedQuery);
              errorDetails += `Query: ${executedQuery.substring(0, 100)}${executedQuery.length > 100 ? '...' : ''}`;
            }
          }
        }
      });
    }
    
    // Show comprehensive error notification
    const fullErrorMessage = `Update failed: ${errorMessage}${errorDetails ? ' | ' + errorDetails : ''}`;
    
    // Use a longer notification for complex errors
    if (context.grafana.notifyError) {
      context.grafana.notifyError(fullErrorMessage);
    } else {
      // Fallback for older Grafana versions
      alert(`Error: ${fullErrorMessage}`);
    }
    
    console.error('Save operation failed:', {
      originalError: error,
      processedMessage: fullErrorMessage,
      deviceId: deviceId,
      changes: changes
    });
  }
}

function cancelEdit(rowIndex) {
  const row = document.querySelector(`tr[data-row-index="${rowIndex}"]`);
  const cells = row.querySelectorAll('.editable-cell');
  
  // Restore original values
  cells.forEach(cell => {
    const cellId = cell.getAttribute('data-cell-id');
    const originalValue = originalValues[cellId];
    cell.innerHTML = originalValue;
  });
  
  exitEditMode(rowIndex);
  context.grafana.notifyInfo('Edit cancelled');
}

function exitEditMode(rowIndex) {
  const row = document.querySelector(`tr[data-row-index="${rowIndex}"]`);
  const editIcon = row.querySelector('.edit-icon');
  const saveIcon = row.querySelector('.save-icon');
  const cancelIcon = row.querySelector('.cancel-icon');

  // Toggle icon visibility
  editIcon.style.display = 'inline-block';
  saveIcon.style.display = 'none';
  cancelIcon.style.display = 'none';

  // Clean up state
  editingCell = null;
  currentFocusedInput = null;
}

async function deleteDevice(deviceId, iconElement) {
  if (!confirm(`Are you sure you want to delete device ${deviceId}?`)) {
    return;
  }

  const theme = context.grafana.theme;

  // Disable icon during delete with theme styling
  const originalClass = iconElement.className;
  iconElement.className = 'delete-icon fas fa-spinner fa-spin';
  iconElement.style.pointerEvents = 'none';
  iconElement.title = 'Deleting...';

  try {
    // Execute DELETE SQL using the detected ID field
    await context.dataSource.sql(currentDataSourceUid, `DELETE FROM devices WHERE ${tableStructure.idField} = '${deviceId}'`);

    // Remove the row from table with smooth animation
    const row = iconElement.closest('tr');
    row.style.transition = 'opacity 0.3s ease';
    row.style.opacity = '0';
    setTimeout(() => row.remove(), 300);

    // Show success notification using Grafana's notification system
    context.grafana.notifySuccess(`Device ${deviceId} deleted successfully`);

  } catch (error) {
    // Re-enable icon on error with proper theme styling
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
    const fullErrorMessage = `Delete failed: ${errorMessage}`;
    context.grafana.notifyError(fullErrorMessage);
    
    console.error('Delete operation failed:', {
      originalError: error,
      processedMessage: fullErrorMessage,
      deviceId: deviceId
    });
  }
}

// Clean up function to remove global event listeners
function cleanup() {
  document.removeEventListener('keydown', handleGlobalKeyboard);
  editingCell = null;
  currentFocusedInput = null;
}

// Optional: Call cleanup when leaving the panel or refreshing
// This can be called from the panel's cleanup/destroy lifecycle if available