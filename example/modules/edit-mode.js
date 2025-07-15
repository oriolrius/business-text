console.debug('start: edit-mode.js');

// Edit mode functionality and inline editing

// Global state for editing
window.editingCell = null;
window.originalValues = {};
window.currentFocusedInput = null;

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
  const isTimestampField = window.deviceConfig.timestampPatterns.some(pattern => pattern.test(fieldName));

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
  const isTimestampField = window.deviceConfig.timestampPatterns.some(pattern => pattern.test(fieldName));

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

console.debug('end: edit-mode.js');