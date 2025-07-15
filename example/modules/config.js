console.debug('start: config.js');

// Configuration constants for the device management system
window.deviceConfig = {
  dataSourceUid: 'sqlite-demo',
  table: 'devices',
  fontAwesome: {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    integrity: 'sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==',
    crossOrigin: 'anonymous',
    referrerPolicy: 'no-referrer'
  },
  timestampPatterns: [
    /.*_at$/i,
    /.*_time$/i,
    /.*timestamp$/i,
    /^date$/i,
    /^time$/i
  ],
  idPatterns: [
    /^id$/i,
    /^.*_id$/i,
    /^id_.*$/i,
    /^.*id$/i,
    /^uid$/i,
    /^uuid$/i,
    /^pk$/i,
    /^primary_key$/i
  ],
  columnWidths: {
    actions: 80,
    hostname: 150,
    ipAddress: 140,
    default: 120
  }
};

console.debug('end: config.js');