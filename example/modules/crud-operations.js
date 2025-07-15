console.debug('start: crud-operations.js');

// CRUD operations for device management

window.currentDataSourceUid = window.deviceConfig.dataSourceUid;
window.tableStructure = null;

window.loadDevices = async function() {
  try {
    const result = await context.dataSource.sql(
      window.currentDataSourceUid, 
      `SELECT * FROM ${window.deviceConfig.table} ORDER BY id`
    );
    const rows = context.dataSource.utils.toObjects(result);

    if (rows.length === 0) {
      document.getElementById('devices-table').innerHTML = '<p style="color: var(--text-secondary);">No devices found</p>';
      return;
    }

    // Get Grafana theme for styling
    const theme = context.grafana.theme;

    // Render the table
    window.renderDevicesTable(rows, theme);

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

    const updateSql = `UPDATE ${window.deviceConfig.table} SET ${updates} WHERE ${window.tableStructure.idField} = ${deviceId}`;

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
    const deleteSql = `DELETE FROM ${window.deviceConfig.table} WHERE ${window.tableStructure.idField} = ${deviceId}`;
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

console.debug('end: crud-operations.js');