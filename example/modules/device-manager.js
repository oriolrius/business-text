console.debug('start: device-manager.js');

// Main device management initialization

window.initializeDeviceManagement = function() {
  console.log('🚀 Initializing Device Management...');
  
  // Ensure FontAwesome is loaded
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = window.deviceConfig.fontAwesome.url;
    fontAwesome.integrity = window.deviceConfig.fontAwesome.integrity;
    fontAwesome.crossOrigin = window.deviceConfig.fontAwesome.crossOrigin;
    fontAwesome.referrerPolicy = window.deviceConfig.fontAwesome.referrerPolicy;
    document.head.appendChild(fontAwesome);
    console.log('📦 FontAwesome CSS added as fallback');
  }
  
  const loadButton = document.getElementById('load-devices');
  if (!loadButton) {
    console.error('❌ Load button not found, retrying...');
    setTimeout(window.initializeDeviceManagement, 100);
    return;
  }

  // Remove any existing listeners
  loadButton.removeEventListener('click', window.loadDevices);
  
  // Add click event listener
  loadButton.addEventListener('click', function(e) {
    console.log('📱 Load devices button clicked');
    e.preventDefault();
    window.loadDevices();
  });
  
  console.log('✅ Device Management initialized, button ready');
};

console.debug('end: device-manager.js');