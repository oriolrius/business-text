/**
 * SQLite Device Management - CRUD Operations
 * Extracted CRUD operations for maintainability and separation of concerns
 */

// Ensure DeviceManagement namespace exists
window.DeviceManagement = window.DeviceManagement || {};
const DM = window.DeviceManagement;

// CRUD operations module
DM.crud = {
  /**
   * Load devices from SQLite database
   * @returns {Promise<void>}
   */
  async loadDevices() {
    try {
      const result = await context.dataSource.sql(DM.state.currentDataSourceUid, 'SELECT * FROM devices ORDER BY id');
      const rows = context.dataSource.utils.toObjects(result);

      if (rows.length === 0) {
        document.getElementById('devices-table').innerHTML = '<p style="color: var(--text-secondary);">No devices found</p>';
        return;
      }

      // Store table structure information for better field handling
      const keys = Object.keys(rows[0]);
      DM.state.tableStructure = {
        fields: keys,
        idField: DM.detectIdField(keys),
        editableFields: keys.filter(key => !DM.isIdField(key, keys))
      };

      // Get Grafana theme for styling
      const theme = context.grafana.theme;

      // Generate table HTML
      const tableHtml = DM.crud._generateTableHtml(rows, theme);
      document.getElementById('devices-table').innerHTML = tableHtml;

      // Add event listeners after table creation
      if (DM.ui && DM.ui.addEventListeners) {
        DM.ui.addEventListeners();
      }

    } catch (error) {
      const theme = context.grafana.theme;
      const errorMessage = DM.handleDatabaseError(error, 'load', { operation: 'SELECT * FROM devices' });
      document.getElementById('devices-table').innerHTML = `
        <div class="error-container">
          <strong>SQLite Error:</strong> ${errorMessage}
        </div>`;
    }
  },

  /**
   * Save row changes to SQLite database
   * @param {string} deviceId - The device ID
   * @param {string} rowIndex - The row index
   * @returns {Promise<void>}
   */
  async saveRow(deviceId, rowIndex) {
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
        if (!DM.validateInput(input, theme)) {
          hasValidationErrors = true;
          return;
        }
      } else {
        newValue = cell.textContent.trim();
      }

      updatedData[fieldName] = newValue;

      // Check for changes
      if (DM.state.originalValues[cellId] !== newValue) {
        hasChanges = true;
        changes[fieldName] = {
          old: DM.state.originalValues[cellId],
          new: newValue
        };
      }
    });

    if (hasValidationErrors) {
      DM.notify('error', 'Please fix validation errors before saving');
      return;
    }

    if (!hasChanges) {
      if (DM.ui && DM.ui.exitEditMode) {
        DM.ui.exitEditMode(rowIndex);
      }
      DM.notify('success', 'No changes to save');
      return;
    }

    try {
      // Build UPDATE SQL query for SQLite with only changed fields
      const updates = Object.keys(changes)
        .map(key => {
          const newValue = changes[key].new;
          return `${key} = ${DM.formatSqlValue(key, newValue)}`;
        })
        .join(', ');

      const updateSql = `UPDATE devices SET ${updates} WHERE ${DM.state.tableStructure.idField} = ${deviceId}`;

      // Show saving state
      const saveIcon = row.querySelector('.save-icon');
      const originalSaveClass = saveIcon.className;
      saveIcon.className = 'save-icon fas fa-spinner fa-spin';
      saveIcon.style.pointerEvents = 'none';
      saveIcon.title = 'Saving to SQLite...';

      console.log('Executing SQLite UPDATE:', updateSql);

      // Execute UPDATE SQL using SQLite
      await context.dataSource.sql(DM.state.currentDataSourceUid, updateSql);

      // Update UI with new values and reset original values
      cells.forEach(cell => {
        const fieldName = cell.getAttribute('data-field');
        const cellId = cell.getAttribute('data-cell-id');
        const newValue = updatedData[fieldName];

        cell.innerHTML = DM.formatDisplayValue(fieldName, newValue);
        DM.state.originalValues[cellId] = newValue; // Update stored original values
      });

      // Restore save icon before exiting edit mode
      saveIcon.className = originalSaveClass;
      saveIcon.style.pointerEvents = 'auto';
      saveIcon.title = 'Save changes';

      if (DM.ui && DM.ui.exitEditMode) {
        DM.ui.exitEditMode(rowIndex);
      }

      // Show detailed success message
      const changedFields = Object.keys(changes).join(', ');
      DM.notify('success', `SQLite device updated successfully. Changed: ${changedFields}`);

    } catch (error) {
      // Re-enable save icon on error
      const saveIcon = row.querySelector('.save-icon');
      saveIcon.className = originalSaveClass;
      saveIcon.style.pointerEvents = 'auto';
      saveIcon.title = 'Save changes';

      const errorMessage = DM.handleDatabaseError(error, 'update', {
        deviceId: deviceId,
        changes: changes,
        sql: updateSql
      });
      
      DM.notify('error', errorMessage);
    }
  },

  /**
   * Delete device from SQLite database
   * @param {string} deviceId - The device ID
   * @param {HTMLElement} iconElement - The delete icon element
   * @returns {Promise<void>}
   */
  async deleteDevice(deviceId, iconElement) {
    if (!confirm(`Are you sure you want to delete device ${deviceId}?`)) {
      return;
    }

    // Disable icon during delete
    const originalClass = iconElement.className;
    iconElement.className = 'delete-icon fas fa-spinner fa-spin';
    iconElement.style.pointerEvents = 'none';
    iconElement.title = 'Deleting from SQLite...';

    try {
      // Execute DELETE SQL using SQLite syntax
      const deleteSql = `DELETE FROM devices WHERE ${DM.state.tableStructure.idField} = ${deviceId}`;
      console.log('Executing SQLite DELETE:', deleteSql);
      
      await context.dataSource.sql(DM.state.currentDataSourceUid, deleteSql);

      // Remove the row from table with smooth animation
      const row = iconElement.closest('tr');
      row.style.transition = 'opacity 0.3s ease';
      row.style.opacity = '0';
      setTimeout(() => row.remove(), 300);

      // Show success notification
      DM.notify('success', `SQLite device ${deviceId} deleted successfully`);

    } catch (error) {
      // Re-enable icon on error
      iconElement.className = originalClass;
      iconElement.style.pointerEvents = 'auto';
      iconElement.title = 'Delete row';

      const errorMessage = DM.handleDatabaseError(error, 'delete', {
        deviceId: deviceId,
        sql: deleteSql
      });
      
      DM.notify('error', errorMessage);
    }
  },

  /**
   * Generate table HTML structure
   * @param {Array} rows - Array of data rows
   * @param {Object} theme - Grafana theme object
   * @returns {string} Generated HTML string
   * @private
   */
  _generateTableHtml(rows, theme) {
    // Create scrollable table container with frozen columns
    let html = `
    <div class="table-container">
      <table class="devices-table">
        <thead>
          <tr>
            <th class="actions-header">Actions</th>
            <th class="hostname-header">hostname</th>
            <th class="ip-header">ip_address</th>`;

    // Add remaining headers (scrollable)
    DM.state.tableStructure.fields.forEach(key => {
      const isId = key === DM.state.tableStructure.idField;
      const isFrozen = key === 'hostname' || key === 'ip_address';

      // Skip ID column and frozen columns (already added)
      if (isId || isFrozen) return;

      html += `<th class="scrollable-header">${key}</th>`;
    });

    html += `
          </tr>
        </thead>
        <tbody>`;

    // Add rows with proper styling and event handling
    rows.forEach((row, index) => {
      html += DM.crud._generateRowHtml(row, index, theme);
    });

    html += `
        </tbody>
      </table>
    </div>`;

    return html;
  },

  /**
   * Generate HTML for a single table row
   * @param {Object} row - Data row object
   * @param {number} index - Row index
   * @param {Object} theme - Grafana theme object
   * @returns {string} Generated row HTML
   * @private
   */
  _generateRowHtml(row, index, theme) {
    // Alternate row colors for better readability
    const rowBg = index % 2 === 0 ? theme.colors.background.primary : theme.colors.background.secondary;
    const idValue = row[DM.state.tableStructure.idField];

    let html = `<tr data-row-index="${index}" class="table-row">`;

    // Actions column (frozen left)
    html += `<td class="actions-cell">
      <i class="edit-icon action-icon fas fa-pen" 
         data-device-id="${idValue}" 
         data-row-index="${index}" 
         title="Edit row"></i>
      
      <i class="save-icon action-icon fas fa-check" 
         data-device-id="${idValue}" 
         data-row-index="${index}" 
         title="Save changes"></i>
      
      <i class="cancel-icon action-icon fas fa-times" 
         data-device-id="${idValue}" 
         data-row-index="${index}" 
         title="Cancel edit"></i>
      
      <i class="delete-icon action-icon fas fa-trash" 
         data-device-id="${idValue}" 
         data-row-index="${index}" 
         title="Delete row"></i>
    </td>`;

    // Frozen hostname column
    const hostnameValue = row['hostname'] || '';
    const hostnameCellId = `cell-${index}-hostname`;
    DM.state.originalValues[hostnameCellId] = hostnameValue;

    html += `<td class="editable-cell hostname-cell" 
                 data-field="hostname" 
                 data-cell-id="${hostnameCellId}" 
                 data-row-index="${index}"
                 data-original-value="${hostnameValue}"
                 title="Click to edit">${hostnameValue}</td>`;

    // Frozen ip_address column
    const ipValue = row['ip_address'] || '';
    const ipCellId = `cell-${index}-ip_address`;
    DM.state.originalValues[ipCellId] = ipValue;

    html += `<td class="editable-cell ip-cell" 
                 data-field="ip_address" 
                 data-cell-id="${ipCellId}" 
                 data-row-index="${index}"
                 data-original-value="${ipValue}"
                 title="Click to edit">${ipValue}</td>`;

    // Add remaining scrollable columns
    DM.state.tableStructure.fields.forEach((key, keyIndex) => {
      const isIdField = key === DM.state.tableStructure.idField;
      const isFrozen = key === 'hostname' || key === 'ip_address';

      // Skip ID and frozen columns (already handled)
      if (isIdField || isFrozen) return;

      const cellId = `cell-${index}-${keyIndex}`;
      DM.state.originalValues[cellId] = row[key];
      const isEditable = !isIdField;

      html += `<td class="${isEditable ? 'editable-cell' : 'id-cell'} scrollable-cell" 
                   data-field="${key}" 
                   data-cell-id="${cellId}" 
                   data-row-index="${index}"
                   data-field-index="${keyIndex}"
                   data-original-value="${row[key]}"
                   ${isEditable ? 'title="Click to edit"' : ''}>${DM.formatDisplayValue(key, row[key])}</td>`;
    });

    html += '</tr>';
    return html;
  }
};

console.log('Device Management CRUD module loaded');