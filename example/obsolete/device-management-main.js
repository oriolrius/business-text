/**
 * SQLite Device Management - Main Controller
 * Entry point that orchestrates all modular components
 * This file is loaded via afterRenderRemoteUrl and initializes the system
 */

// Main initialization function
async function initializeDeviceManagement() {
  try {
    console.log('Starting Device Management initialization...');
    
    // Ensure all required dependencies are loaded
    if (!window.DeviceManagement) {
      throw new Error('DeviceManagement namespace not found. Ensure utils.js is loaded first.');
    }

    const DM = window.DeviceManagement;

    // Check for required modules
    if (!DM.crud) {
      throw new Error('CRUD module not found. Ensure device-management-crud.js is loaded.');
    }

    if (!DM.ui) {
      throw new Error('UI module not found. Ensure device-management-ui.js is loaded.');
    }

    // Check for required context
    if (!window.context) {
      throw new Error('Grafana context not available. This script must run in a Business Text panel.');
    }

    if (!window.context.dataSource) {
      throw new Error('DataSource API not available. Ensure data source queries are enabled in panel options.');
    }

    // Initialize the UI system
    console.log('Initializing UI system...');
    await DM.ui.initialize();

    console.log('Device Management system initialized successfully');

    // Register cleanup function for panel refresh/destroy
    if (window.addEventListener) {
      window.addEventListener('beforeunload', DM.cleanup);
    }

    // Make DeviceManagement globally accessible for debugging
    window.DM = DM;

  } catch (error) {
    console.error('Device Management initialization failed:', error);
    
    // Show error in the UI
    const errorContainer = document.getElementById('devices-table');
    if (errorContainer) {
      errorContainer.innerHTML = `
        <div style="
          padding: 20px;
          background: var(--error-color, #ff4444)15;
          border: 1px solid var(--error-color, #ff4444);
          border-radius: 8px;
          color: var(--error-text, #ffffff);
          font-family: var(--font-family, 'Inter, sans-serif');
        ">
          <h3 style="margin: 0 0 10px 0;">🚨 Device Management Initialization Failed</h3>
          <p style="margin: 5px 0;"><strong>Error:</strong> ${error.message}</p>
          <p style="margin: 10px 0 5px 0; font-size: 14px;">
            <strong>Troubleshooting:</strong>
          </p>
          <ul style="margin: 5px 0; padding-left: 20px; font-size: 13px;">
            <li>Check that all remote JavaScript files are accessible</li>
            <li>Verify that the static service is running (docker-compose up)</li>
            <li>Ensure data source queries are enabled in panel options</li>
            <li>Check browser console for additional error details</li>
          </ul>
          <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">
            See README.md in the examples folder for setup instructions.
          </p>
        </div>
      `;
    }

    // Also try to show notification if Grafana context is available
    if (window.context && window.context.grafana && window.context.grafana.notifyError) {
      window.context.grafana.notifyError(['Initialization Error', 'Device Management initialization failed: ' + error.message]);
    }
  }
}

// Auto-initialization when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDeviceManagement);
} else {
  // DOM is already loaded
  initializeDeviceManagement();
}

// Export for manual initialization if needed
window.initializeDeviceManagement = initializeDeviceManagement;

console.log('Device Management main controller loaded');