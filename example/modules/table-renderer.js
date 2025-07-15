console.debug('start: table-renderer.js');

// Table rendering functionality

window.renderDevicesTable = function(rows, theme) {
  if (rows.length === 0) {
    document.getElementById('devices-table').innerHTML = '<p style="color: var(--text-secondary);">No devices found</p>';
    return;
  }

  // Store table structure information for better field handling
  const keys = Object.keys(rows[0]);
  window.tableStructure = {
    fields: keys,
    idField: window.detectIdField(keys),
    editableFields: keys.filter(key => !window.isIdField(key, keys))
  };

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
          ${renderTableHeaders(theme)}
        </tr>
      </thead>
      <tbody>
        ${renderTableRows(rows, theme)}
      </tbody>
    </table>
  </div>`;

  document.getElementById('devices-table').innerHTML = html;
};

function renderTableHeaders(theme) {
  let headers = '';
  
  // Actions column (frozen left)
  headers += `
    <th style="
      position: sticky;
      left: 0;
      z-index: 20;
      width: ${window.deviceConfig.columnWidths.actions}px;
      padding: ${theme.spacing(1, 2)};
      border: 1px solid ${theme.colors.border.medium};
      font-weight: ${theme.typography.fontWeightMedium};
      color: ${theme.colors.primary.contrastText};
      text-align: center;
      background: ${theme.colors.primary.main};
      background-clip: padding-box;
      box-shadow: 2px 0 8px rgba(0,0,0,0.2), inset 0 0 0 1000px ${theme.colors.primary.main};
      border-right: 3px solid ${theme.colors.border.strong};
    ">Actions</th>`;
  
  // Frozen hostname column
  headers += `
    <th style="
      position: sticky;
      left: ${window.deviceConfig.columnWidths.actions}px;
      z-index: 19;
      width: ${window.deviceConfig.columnWidths.hostname}px;
      padding: ${theme.spacing(1, 2)};
      border: 1px solid ${theme.colors.border.medium};
      font-weight: ${theme.typography.fontWeightMedium};
      color: ${theme.colors.primary.contrastText};
      text-align: left;
      background: ${theme.colors.primary.main};
      background-clip: padding-box;
      box-shadow: 2px 0 8px rgba(0,0,0,0.2), inset 0 0 0 1000px ${theme.colors.primary.main};
      border-right: 3px solid ${theme.colors.border.strong};
    ">hostname</th>`;
  
  // Frozen ip_address column
  const leftOffset = window.deviceConfig.columnWidths.actions + window.deviceConfig.columnWidths.hostname;
  headers += `
    <th style="
      position: sticky;
      left: ${leftOffset}px;
      z-index: 18;
      width: ${window.deviceConfig.columnWidths.ipAddress}px;
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

    headers += `<th style="
      min-width: ${window.deviceConfig.columnWidths.default}px;
      padding: ${theme.spacing(1, 2)};
      border: 1px solid ${theme.colors.border.medium};
      font-weight: ${theme.typography.fontWeightMedium};
      color: ${theme.colors.primary.contrastText};
      text-align: left;
      background: ${theme.colors.primary.main};
    ">${key}</th>`;
  });

  return headers;
}

function renderTableRows(rows, theme) {
  let rowsHtml = '';

  rows.forEach((row, index) => {
    // Alternate row colors for better readability
    const rowBg = index % 2 === 0 ? theme.colors.background.primary : theme.colors.background.secondary;

    rowsHtml += `<tr data-row-index="${index}" style="
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
    rowsHtml += renderActionsCell(idValue, index, rowBg, theme);

    // Frozen hostname column
    rowsHtml += renderFrozenCell(row, 'hostname', index, window.deviceConfig.columnWidths.actions, rowBg, theme);

    // Frozen ip_address column
    const leftOffset = window.deviceConfig.columnWidths.actions + window.deviceConfig.columnWidths.hostname;
    rowsHtml += renderFrozenCell(row, 'ip_address', index, leftOffset, rowBg, theme);

    // Add remaining scrollable columns
    window.tableStructure.fields.forEach((key, keyIndex) => {
      const isIdField = key === window.tableStructure.idField;
      const isFrozen = key === 'hostname' || key === 'ip_address';

      // Skip ID and frozen columns (already handled)
      if (isIdField || isFrozen) return;

      const cellId = `cell-${index}-${keyIndex}`;
      window.originalValues[cellId] = row[key];
      const isEditable = !isIdField;

      rowsHtml += `<td class="${isEditable ? 'editable-cell' : 'id-cell'}" 
                       data-field="${key}" 
                       data-cell-id="${cellId}" 
                       data-row-index="${index}"
                       data-field-index="${keyIndex}"
                       data-original-value="${row[key]}"
                       style="
        min-width: ${window.deviceConfig.columnWidths.default}px;
        padding: ${theme.spacing(1, 2)};
        border: 1px solid ${theme.colors.border.weak};
        color: ${theme.colors.text.primary};
        cursor: ${isEditable ? 'pointer' : 'default'};
        position: relative;
      " ${isEditable ? 'title="Click to edit"' : ''}>${window.formatDisplayValue(key, row[key])}</td>`;
    });

    rowsHtml += '</tr>';
  });

  return rowsHtml;
}

function renderActionsCell(idValue, index, rowBg, theme) {
  return `<td style="
    position: sticky;
    left: 0;
    z-index: 15;
    width: ${window.deviceConfig.columnWidths.actions}px;
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
}

function renderFrozenCell(row, fieldName, index, leftOffset, rowBg, theme) {
  const value = row[fieldName] || '';
  const cellId = `cell-${index}-${fieldName}`;
  window.originalValues[cellId] = value;

  const width = fieldName === 'hostname' 
    ? window.deviceConfig.columnWidths.hostname 
    : window.deviceConfig.columnWidths.ipAddress;

  return `<td class="editable-cell" 
               data-field="${fieldName}" 
               data-cell-id="${cellId}" 
               data-row-index="${index}"
               data-original-value="${value}"
               style="
    position: sticky;
    left: ${leftOffset}px;
    z-index: ${fieldName === 'hostname' ? 14 : 13};
    width: ${width}px;
    padding: ${theme.spacing(1, 2)};
    border: 1px solid transparent;
    color: ${theme.colors.text.primary};
    cursor: pointer;
    background: ${rowBg};
    background-clip: padding-box;
    box-shadow: 2px 0 8px rgba(0,0,0,0.2), inset 0 0 0 1000px ${rowBg}, inset 3px 0 0 ${theme.colors.border.strong};
    border-right: 3px solid ${theme.colors.border.strong};
  "
     title="Click to edit">${value}</td>`;
}

console.debug('end: table-renderer.js');