/**
 * SQLite Device Management - Modular Component Loader
 * This script loads all required CSS and JS files in the correct order
 * Used as the main afterRender script to orchestrate the modular system
 */

// Configuration for remote files
const STATIC_BASE_URL = 'http://static';
const COMPONENTS = {
  css: [
    'device-management-core.css',
    'device-management-table.css'
  ],
  js: [
    'device-management-utils.js',
    'device-management-crud.js',
    'device-management-ui.js',
    'device-management-main.js'
  ]
};

/**
 * Load CSS file dynamically
 * @param {string} url - CSS file URL
 * @returns {Promise<void>}
 */
function loadCSS(url) {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.querySelector(`link[href="${url}"]`)) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));
    
    document.head.appendChild(link);
  });
}

/**
 * Load JavaScript file dynamically
 * @param {string} url - JavaScript file URL
 * @returns {Promise<void>}
 */
function loadJS(url) {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.querySelector(`script[src="${url}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load JS: ${url}`));
    
    document.head.appendChild(script);
  });
}

/**
 * Load HTML content and inject into container
 * @param {string} url - HTML file URL
 * @param {string} containerId - Target container ID
 * @returns {Promise<void>}
 */
async function loadHTML(url, containerId) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const container = document.getElementById(containerId);
    
    if (!container) {
      throw new Error(`Container element with ID '${containerId}' not found`);
    }
    
    container.innerHTML = html;
  } catch (error) {
    throw new Error(`Failed to load HTML from ${url}: ${error.message}`);
  }
}

/**
 * Main loader function
 */
async function loadDeviceManagementComponents() {
  try {
    console.log('Loading Device Management modular components...');
    
    // Show loading state
    const loadingHtml = `
      <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
        <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 10px; color: var(--primary-color);"></i>
        <div>Loading modular components...</div>
        <div style="font-size: 12px; margin-top: 5px; opacity: 0.7;">CSS, JavaScript, and HTML modules</div>
      </div>
    `;
    document.body.innerHTML = loadingHtml;

    // Load CSS files first (parallel)
    console.log('Loading CSS components...');
    const cssPromises = COMPONENTS.css.map(file => 
      loadCSS(`${STATIC_BASE_URL}/${file}`)
    );
    await Promise.all(cssPromises);
    console.log('✓ CSS components loaded');

    // Load main HTML structure
    console.log('Loading HTML content...');
    await loadHTML(`${STATIC_BASE_URL}/device-management-content.html`, 'content');
    
    // Actually inject the HTML since we're in the afterRender context
    const response = await fetch(`${STATIC_BASE_URL}/device-management-content.html`);
    const htmlContent = await response.text();
    document.body.innerHTML = htmlContent;
    console.log('✓ HTML content loaded');

    // Load JavaScript files in sequence (dependencies matter)
    console.log('Loading JavaScript components...');
    for (const file of COMPONENTS.js) {
      await loadJS(`${STATIC_BASE_URL}/${file}`);
      console.log(`✓ Loaded ${file}`);
    }
    console.log('✓ All JavaScript components loaded');

    console.log('🎉 Device Management modular system loaded successfully!');

  } catch (error) {
    console.error('Failed to load Device Management components:', error);
    
    // Show error state
    document.body.innerHTML = `
      <div style="
        padding: 20px;
        background: var(--error-color, #ff4444)15;
        border: 1px solid var(--error-color, #ff4444);
        border-radius: 8px;
        color: var(--error-text, #ffffff);
        font-family: var(--font-family, 'Inter, sans-serif');
      ">
        <h3 style="margin: 0 0 10px 0;">🚨 Component Loading Failed</h3>
        <p style="margin: 5px 0;"><strong>Error:</strong> ${error.message}</p>
        <p style="margin: 10px 0 5px 0; font-size: 14px;">
          <strong>Troubleshooting:</strong>
        </p>
        <ul style="margin: 5px 0; padding-left: 20px; font-size: 13px;">
          <li>Ensure the static service is running: <code>docker-compose up</code></li>
          <li>Check that files exist in the example/ directory</li>
          <li>Verify network connectivity to ${STATIC_BASE_URL}</li>
          <li>Check browser console for CORS or network errors</li>
        </ul>
        <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">
          Files expected: ${[...COMPONENTS.css, ...COMPONENTS.js, 'device-management-content.html'].join(', ')}
        </p>
      </div>
    `;

    // Also try to show notification if Grafana context is available
    if (window.context && window.context.grafana && window.context.grafana.notifyError) {
      window.context.grafana.notifyError(['Load Error', 'Failed to load modular components: ' + error.message]);
    }
  }
}

// Start loading immediately
loadDeviceManagementComponents();