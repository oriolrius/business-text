let currentDataSourceUid = 'cerq98n76ap6od'; // Replace with your actual data source UID

document.getElementById('load-devices').addEventListener('click', loadDevices);

async function loadDevices() {
  try {
    const result = await context.dataSource.sql(currentDataSourceUid, 'SELECT * FROM devices');
    const rows = context.dataSource.utils.toObjects(result);

    if (rows.length === 0) {
      document.getElementById('devices-table').innerHTML = '<p>No devices found</p>';
      return;
    }

    // Create table HTML
    let html = '<table><thead><tr>';

    // Add headers
    const keys = Object.keys(rows[0]);
    keys.forEach(key => {
      html += `<th>${key}</th>`;
    });
    html += '<th>Actions</th></tr></thead><tbody>';

    // Add rows with delete buttons (using event listeners instead of onclick)
    rows.forEach((row, index) => {
      html += '<tr>';
      keys.forEach(key => {
        html += `<td>${row[key]}</td>`;
      });

      // Assuming first column is the ID field
      const idField = keys[0];
      const idValue = row[idField];

      html += `<td><button class="delete-btn" data-device-id="${idValue}" data-row-index="${index}">Delete</button></td>`;
      html += '</tr>';
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
    document.getElementById('devices-table').innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
  }
}

async function deleteDevice(deviceId, buttonElement) {
  if (!confirm(`Are you sure you want to delete device ${deviceId}?`)) {
    return;
  }

  // Disable button during delete
  buttonElement.disabled = true;
  buttonElement.textContent = 'Deleting...';

  try {
    // Execute DELETE SQL - adjust the column name if needed (assuming 'id' column)
    await context.dataSource.sql(currentDataSourceUid, `DELETE FROM devices WHERE id = '${deviceId}'`);

    // Remove the row from table
    const row = buttonElement.closest('tr');
    row.remove();

    // Show success message
    alert(`Device ${deviceId} deleted successfully`);

  } catch (error) {
    // Re-enable button on error
    buttonElement.disabled = false;
    buttonElement.textContent = 'Delete';

    alert(`Error deleting device: ${error.message}`);
  }
}