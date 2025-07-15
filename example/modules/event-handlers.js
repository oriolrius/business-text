console.debug('start: event-handlers.js');

// Event handlers and listeners

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

console.debug('end: event-handlers.js');