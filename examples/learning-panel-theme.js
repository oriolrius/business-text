let currentDataSourceUid = 'cerq98n76ap6od'; // Replace with your actual data source UID

document.getElementById('load-devices').addEventListener('click', loadDevices);

async function loadDevices() {
  try {
    const result = await context.dataSource.sql(currentDataSourceUid, 'SELECT * FROM devices');
    const rows = context.dataSource.utils.toObjects(result);

    if (rows.length === 0) {
      document.getElementById('devices-table').innerHTML = '<p style="color: var(--text-secondary);">No devices found</p>';
      return;
    }

    // Get Grafana theme for styling
    const theme = context.grafana.theme;

    // Create table HTML with Grafana theme styling
    let html = `<table style="
      width: 100%;
      border-collapse: collapse;
      background: ${theme.colors.background.primary};
      color: ${theme.colors.text.primary};
      font-family: ${theme.typography.fontFamily};
      font-size: ${theme.typography.body.fontSize};
      border: 1px solid ${theme.colors.border.weak};
    "><thead><tr style="background: ${theme.colors.primary.main};">`;

    // Add headers with better contrast - using primary color with contrast text
    const keys = Object.keys(rows[0]);
    keys.forEach(key => {
      html += `<th style="
        padding: ${theme.spacing(1, 2)};
        border: 1px solid ${theme.colors.border.medium};
        font-weight: ${theme.typography.fontWeightMedium};
        color: ${theme.colors.primary.contrastText};
        text-align: left;
        background: ${theme.colors.primary.main};
      ">${key}</th>`;
    });
    html += `<th style="
      padding: ${theme.spacing(1, 2)};
      border: 1px solid ${theme.colors.border.medium};
      font-weight: ${theme.typography.fontWeightMedium};
      color: ${theme.colors.primary.contrastText};
      text-align: left;
      background: ${theme.colors.primary.main};
    ">Actions</th></tr></thead><tbody>`;

    // Add rows with delete buttons and theme styling
    rows.forEach((row, index) => {
      // Alternate row colors for better readability
      const rowBg = index % 2 === 0 ? theme.colors.background.primary : 'rgba(204, 204, 220, 0.05)';

      html += `<tr style="
        background: ${rowBg};
      " onmouseover="this.style.background='${theme.colors.action.hover}'" 
         onmouseout="this.style.background='${rowBg}'">`;

      keys.forEach(key => {
        html += `<td style="
          padding: ${theme.spacing(1, 2)};
          border: 1px solid ${theme.colors.border.weak};
          color: ${theme.colors.text.primary};
        ">${row[key]}</td>`;
      });

      // Assuming first column is the ID field
      const idField = keys[0];
      const idValue = row[idField];

      html += `<td style="
        padding: ${theme.spacing(1, 2)};
        border: 1px solid ${theme.colors.border.weak};
      ">
        <button class="delete-btn" data-device-id="${idValue}" data-row-index="${index}" style="
          background: ${theme.colors.error.main};
          color: ${theme.colors.error.contrastText};
          border: none;
          padding: ${theme.spacing(0.5, 1.5)};
          border-radius: ${theme.shape.borderRadius(1)}px;
          font-size: ${theme.typography.bodySmall.fontSize};
          font-family: ${theme.typography.fontFamily};
          cursor: pointer;
          transition: background-color 0.2s ease;
        " onmouseover="this.style.background='${theme.colors.error.shade}'"
           onmouseout="this.style.background='${theme.colors.error.main}'">Delete</button>
      </td></tr>`;
    });

    html += '</tbody></table>';

    document.getElementById('devices-table').innerHTML = html;

    // Add event listeners to all delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', async function () {
        const deviceId = this.getAttribute('data-device-id');
        await deleteDevice(deviceId, this);
      });
    });

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

async function deleteDevice(deviceId, buttonElement) {
  if (!confirm(`Are you sure you want to delete device ${deviceId}?`)) {
    return;
  }

  const theme = context.grafana.theme;

  // Disable button during delete with theme styling
  buttonElement.disabled = true;
  buttonElement.textContent = 'Deleting...';
  buttonElement.style.background = theme.colors.text.disabled;
  buttonElement.style.cursor = 'not-allowed';

  try {
    // Execute DELETE SQL - adjust the column name if needed (assuming 'id' column)
    await context.dataSource.sql(currentDataSourceUid, `DELETE FROM devices WHERE id = '${deviceId}'`);

    // Remove the row from table with smooth animation
    const row = buttonElement.closest('tr');
    row.style.transition = 'opacity 0.3s ease';
    row.style.opacity = '0';
    setTimeout(() => row.remove(), 300);

    // Show success notification using Grafana's notification system
    context.grafana.notifySuccess(`Device ${deviceId} deleted successfully`);

  } catch (error) {
    // Re-enable button on error with proper theme styling
    buttonElement.disabled = false;
    buttonElement.textContent = 'Delete';
    buttonElement.style.background = theme.colors.error.main;
    buttonElement.style.cursor = 'pointer';

    // Show error notification using Grafana's notification system
    context.grafana.notifyError(`Error deleting device: ${error.message}`);
  }
}
