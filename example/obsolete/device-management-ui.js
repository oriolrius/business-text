/**
 * SQLite Device Management - UI Interactions
 * Extracted UI interaction logic for maintainability and separation of concerns
 */

// Ensure DeviceManagement namespace exists
window.DeviceManagement = window.DeviceManagement || {};
const DM = window.DeviceManagement;

// UI interactions module
DM.ui = {
  /**
   * Add event listeners to table elements
   */
  addEventListeners() {
    const theme = context.grafana.theme;

    // Edit icon listeners
    document.querySelectorAll('.edit-icon').forEach(icon => {
      icon.addEventListener('click', function () {
        const rowIndex = this.getAttribute('data-row-index');
        DM.ui.enterEditMode(rowIndex);
      });
    });

    // Save icon listeners
    document.querySelectorAll('.save-icon').forEach(icon => {
      icon.addEventListener('click', async function () {
        const deviceId = this.getAttribute('data-device-id');
        const rowIndex = this.getAttribute('data-row-index');
        await DM.crud.saveRow(deviceId, rowIndex);
      });
    });

    // Cancel icon listeners
    document.querySelectorAll('.cancel-icon').forEach(icon => {
      icon.addEventListener('click', function () {
        const rowIndex = this.getAttribute('data-row-index');
        DM.ui.cancelEdit(rowIndex);
      });
    });

    // Delete icon listeners
    document.querySelectorAll('.delete-icon').forEach(icon => {
      icon.addEventListener('click', async function () {
        const deviceId = this.getAttribute('data-device-id');
        await DM.crud.deleteDevice(deviceId, this);
      });
    });

    // Cell click listeners for inline editing
    document.querySelectorAll('.editable-cell').forEach(cell => {
      cell.addEventListener('click', function () {
        const rowIndex = this.getAttribute('data-row-index');
        if (DM.state.editingCell === null) {
          DM.ui.enterEditMode(rowIndex);
          DM.ui.makeInlineEditable(this);
        }
      });
    });

    // Add row hover effects
    document.querySelectorAll('.table-row').forEach(row => {
      row.addEventListener('mouseenter', DM.ui.handleRowHover.bind(null, row, true));
      row.addEventListener('mouseleave', DM.ui.handleRowHover.bind(null, row, false));
    });

    // Add keyboard navigation support
    document.addEventListener('keydown', DM.ui.handleGlobalKeyboard);
  },

  /**
   * Handle row hover effects for frozen columns
   * @param {HTMLElement} row - The table row element
   * @param {boolean} isHover - Whether hovering or not
   */
  handleRowHover(row, isHover) {
    const theme = context.grafana.theme;
    const actionCell = row.children[0];
    const hostnameCell = row.children[1];
    const ipCell = row.children[2];
    
    if (isHover) {
      row.style.background = theme.colors.action.hover;
      row.classList.add('row-hover');
      
      // Update frozen column backgrounds on hover
      if (actionCell) {
        actionCell.style.boxShadow = `2px 0 8px rgba(0,0,0,0.2), inset 0 0 0 1000px ${theme.colors.action.hover}, inset 3px 0 0 ${theme.colors.border.strong}`;
      }
      if (hostnameCell) {
        hostnameCell.style.boxShadow = `2px 0 8px rgba(0,0,0,0.2), inset 0 0 0 1000px ${theme.colors.action.hover}, inset 3px 0 0 ${theme.colors.border.strong}`;
      }
      if (ipCell) {
        ipCell.style.boxShadow = `2px 0 8px rgba(0,0,0,0.2), inset 0 0 0 1000px ${theme.colors.action.hover}, inset 3px 0 0 ${theme.colors.border.strong}`;
      }
    } else {
      const index = row.getAttribute('data-row-index');
      const rowBg = index % 2 === 0 ? theme.colors.background.primary : theme.colors.background.secondary;
      
      row.style.background = rowBg;
      row.classList.remove('row-hover');
      
      // Restore frozen column backgrounds
      if (actionCell) {
        actionCell.style.boxShadow = `2px 0 8px rgba(0,0,0,0.2), inset 0 0 0 1000px ${rowBg}, inset 3px 0 0 ${theme.colors.border.strong}`;
      }
      if (hostnameCell) {
        hostnameCell.style.boxShadow = `2px 0 8px rgba(0,0,0,0.2), inset 0 0 0 1000px ${rowBg}, inset 3px 0 0 ${theme.colors.border.strong}`;
      }
      if (ipCell) {
        ipCell.style.boxShadow = `2px 0 8px rgba(0,0,0,0.2), inset 0 0 0 1000px ${rowBg}, inset 3px 0 0 ${theme.colors.border.strong}`;
      }
    }
  },

  /**
   * Global keyboard handler for navigation and shortcuts
   * @param {KeyboardEvent} e - The keyboard event
   */
  handleGlobalKeyboard(e) {
    // Only handle keyboard events during editing
    if (DM.state.editingCell === null) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      DM.ui.cancelEdit(DM.state.editingCell);
    }

    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      const row = document.querySelector(`tr[data-row-index="${DM.state.editingCell}"]`);
      const saveIcon = row.querySelector('.save-icon');
      if (saveIcon && saveIcon.style.display !== 'none') {
        saveIcon.click();
      }
    }
  },

  /**
   * Enter edit mode for a specific row
   * @param {string} rowIndex - The row index
   */
  enterEditMode(rowIndex) {
    if (DM.state.editingCell !== null) {
      DM.notify('error', 'Please save or cancel current edit before editing another row');
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
      DM.state.originalValues[cellId] = currentValue;
    });

    // Make cells editable
    cells.forEach(cell => {
      DM.ui.makeInlineEditable(cell);
    });

    DM.state.editingCell = rowIndex;
  },

  /**
   * Make a cell inline editable
   * @param {HTMLElement} cell - The cell element to make editable
   */
  makeInlineEditable(cell) {
    const theme = context.grafana.theme;
    const cellId = cell.getAttribute('data-cell-id');
    const fieldName = cell.getAttribute('data-field');
    
    // Get original value
    let originalValue = cell.getAttribute('data-original-value');
    if (!originalValue) {
      originalValue = DM.state.originalValues[cellId];
    }
    if (originalValue === undefined || originalValue === null) {
      originalValue = cell.textContent.trim();
    }
    if (!originalValue) {
      originalValue = '';
    }

    // Skip ID field editing
    if (fieldName === DM.state.tableStructure.idField) {
      DM.notify('error', 'ID field cannot be edited');
      return;
    }

    // Create input with better styling
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalValue;
    input.setAttribute('data-original-value', originalValue);
    input.setAttribute('data-field', fieldName);
    input.className = 'inline-input';

    // Add placeholder for timestamp fields
    const timestampPatterns = [
      /.*_at$/i, /.*_time$/i, /.*timestamp$/i, /^date$/i, /^time$/i
    ];
    const isTimestampField = timestampPatterns.some(pattern => pattern.test(fieldName));

    if (isTimestampField) {
      input.placeholder = 'e.g., 1671234567 (Unix) or 2023-12-17T10:30:00Z (ISO)';
      input.title = 'Enter Unix timestamp or ISO date format';
    }

    // Enhanced keyboard navigation and input handling
    input.addEventListener('keydown', function (e) {
      DM.ui.handleInputKeyboard(e, cell, input);
    });

    input.addEventListener('focus', function () {
      DM.state.currentFocusedInput = input;
      this.style.borderColor = theme.colors.primary.border;
      this.style.boxShadow = `0 0 0 2px ${theme.colors.primary.transparent}`;
    });

    input.addEventListener('blur', function () {
      this.style.borderColor = theme.colors.border.medium;
      this.style.boxShadow = 'none';
    });

    // Validate input on change
    input.addEventListener('input', function () {
      DM.validateInput(input, theme);
    });

    cell.innerHTML = '';
    cell.appendChild(input);
    cell.classList.add('editing');
    input.focus();
    input.select();
    DM.state.currentFocusedInput = input;
  },

  /**
   * Enhanced keyboard handling for input fields
   * @param {KeyboardEvent} e - The keyboard event
   * @param {HTMLElement} cell - The cell element
   * @param {HTMLInputElement} input - The input element
   */
  handleInputKeyboard(e, cell, input) {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        const nextCell = DM.getNextEditableCell(cell);
        if (nextCell) {
          DM.ui.makeInlineEditable(nextCell);
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
          const prevCell = DM.getPreviousEditableCell(cell);
          if (prevCell) {
            DM.ui.makeInlineEditable(prevCell);
          }
        } else {
          // Tab: Move to next editable cell
          const nextCell = DM.getNextEditableCell(cell);
          if (nextCell) {
            DM.ui.makeInlineEditable(nextCell);
          }
        }
        break;

      case 'Escape':
        e.preventDefault();
        DM.ui.cancelEdit(DM.state.editingCell);
        break;
    }
  },

  /**
   * Cancel edit mode for a specific row
   * @param {string} rowIndex - The row index
   */
  cancelEdit(rowIndex) {
    const row = document.querySelector(`tr[data-row-index="${rowIndex}"]`);
    const cells = row.querySelectorAll('.editable-cell');

    // Restore original values
    cells.forEach(cell => {
      const cellId = cell.getAttribute('data-cell-id');
      const fieldName = cell.getAttribute('data-field');
      const originalValue = DM.state.originalValues[cellId];
      cell.innerHTML = DM.formatDisplayValue(fieldName, originalValue);
      cell.classList.remove('editing');
    });

    DM.ui.exitEditMode(rowIndex);
    DM.notify('success', 'Edit cancelled');
  },

  /**
   * Exit edit mode for a specific row
   * @param {string} rowIndex - The row index
   */
  exitEditMode(rowIndex) {
    const row = document.querySelector(`tr[data-row-index="${rowIndex}"]`);
    const editIcon = row.querySelector('.edit-icon');
    const saveIcon = row.querySelector('.save-icon');
    const cancelIcon = row.querySelector('.cancel-icon');

    // Toggle icon visibility
    editIcon.style.display = 'inline-block';
    saveIcon.style.display = 'none';
    cancelIcon.style.display = 'none';

    // Reset save icon to original state (in case it was a spinner)
    saveIcon.className = 'save-icon action-icon fas fa-check';
    saveIcon.style.pointerEvents = 'auto';
    saveIcon.title = 'Save changes';

    // Remove editing class from cells
    const cells = row.querySelectorAll('.editable-cell');
    cells.forEach(cell => {
      cell.classList.remove('editing');
    });

    // Clean up state
    DM.state.editingCell = null;
    DM.state.currentFocusedInput = null;
  },

  /**
   * Initialize UI interactions and load initial data
   */
  async initialize() {
    console.log('Initializing Device Management UI...');
    
    // Add load button event listener
    const loadButton = document.getElementById('load-devices');
    if (loadButton) {
      loadButton.addEventListener('click', async () => {
        try {
          await DM.crud.loadDevices();
        } catch (error) {
          console.error('Failed to load devices:', error);
          DM.notify('error', 'Failed to load devices');
        }
      });
    }

    // Load devices automatically on initialization
    try {
      await DM.crud.loadDevices();
    } catch (error) {
      console.error('Auto-load failed:', error);
      // Don't show error notification here, let user click the load button
    }
  }
};

console.log('Device Management UI module loaded');