# SQLite Device Management - Modular Architecture

This directory contains a modular version of the SQLite Device Management dashboard, demonstrating the Business Text plugin's capability to load remote components for better maintainability and development workflow.

## 🏗️ Architecture Overview

The original monolithic dashboard (500+ lines of inline code) has been refactored into a clean, modular architecture:

### **Modular Components Structure**

```
example/
├── README.md                           # This file - AI development context
├── device-management-core.css          # Base styles & UI components
├── device-management-table.css         # Table-specific styles & frozen columns
├── device-management-utils.js          # Utility functions & validation
├── device-management-crud.js           # Database operations (Create, Read, Update, Delete)
├── device-management-ui.js             # UI interactions & event handling
├── device-management-main.js           # Main controller & initialization
├── device-management-loader.js         # Component loader & orchestrator
└── device-management-content.html      # Simplified HTML structure
```

### **Remote Loading System**

The Business Text panel now uses:
- **stylesRemoteUrl**: Points to CSS files for styling
- **afterRenderRemoteUrl**: Points to the loader script
- **Minimal afterRender**: Simple fallback code
- **Simplified content**: Basic HTML structure with loading states

## 🎯 Purpose & Benefits

### **For Development & Maintenance**
- **Modular Code**: Each file has a single responsibility
- **Better Organization**: Related functions grouped logically
- **Easier Debugging**: Smaller, focused files
- **Version Control**: Better diffs and code reviews
- **Reusability**: Components can be shared across dashboards

### **For AI Development Workflow**
This setup is ideal for AI-assisted development because:
- **Focused Context**: AI can work on specific modules
- **Clear Dependencies**: Module relationships are explicit
- **Incremental Updates**: Changes can be made to individual components
- **Testing Isolation**: Each module can be tested independently

## 🔧 Technical Implementation

### **Component Loading Flow**
1. **Dashboard Loads** → Grafana renders Business Text panel
2. **Remote Loader** → `device-management-loader.js` orchestrates loading
3. **CSS Loading** → Parallel loading of style files
4. **HTML Structure** → Remote HTML content replaces placeholder
5. **JS Modules** → Sequential loading of JavaScript components
6. **Initialization** → Main controller starts the system

### **Key Features Preserved**
All original functionality remains identical:
- ✅ SQLite CRUD operations with error handling
- ✅ Inline editing with keyboard navigation (Tab, Enter, Ctrl+S, Esc)
- ✅ Real-time validation and visual feedback
- ✅ Frozen columns (actions, hostname, ip_address)
- ✅ Responsive table layout with hover effects
- ✅ Timestamp handling (Unix epochs ↔ readable dates)
- ✅ Theme integration (light/dark mode support)
- ✅ Comprehensive error messages and logging

### **Development Guidelines for AI Agents**

When working with this modular system:

1. **Understanding the System**
   - Start with `device-management-main.js` to understand initialization
   - Review `device-management-utils.js` for shared functionality
   - Check dependencies: utils → crud/ui → main

2. **Making Changes**
   - **Styling**: Edit CSS files (`*-core.css`, `*-table.css`)
   - **Data Operations**: Modify `device-management-crud.js`
   - **User Interactions**: Update `device-management-ui.js`
   - **Utilities**: Enhance `device-management-utils.js`

3. **Testing Changes**
   - Restart docker-compose to reload static files
   - Refresh Grafana dashboard to see changes
   - Check browser console for loading errors
   - Verify all functionality still works identically

4. **Adding Features**
   - Add new utility functions to `utils.js`
   - Extend CRUD operations in `crud.js`
   - Enhance UI interactions in `ui.js`
   - Update CSS files for styling

## 🚀 Getting Started

### **Prerequisites**
- Docker and docker-compose installed
- Business Text plugin running in Grafana
- SQLite datasource configured (`sqlite-demo`)

### **Running the System**
```bash
# Start the static file server and Grafana
docker-compose up

# Access Grafana at http://localhost:3000
# Navigate to SQLite Device Management dashboard
# The modular system loads automatically
```

### **Development Workflow**
1. **Edit Files**: Modify components in `example/` directory
2. **Refresh Dashboard**: Reload the Grafana panel
3. **Test Functionality**: Verify all features work correctly
4. **Iterate**: Make incremental improvements

## 📝 Component Details

### **CSS Architecture**
- **`device-management-core.css`**: Base styling, forms, buttons, notifications
- **`device-management-table.css`**: Table layout, frozen columns, responsive design

### **JavaScript Architecture**
- **`device-management-utils.js`**: Shared utilities, validation, formatting
- **`device-management-crud.js`**: Database operations, SQL generation, error handling
- **`device-management-ui.js`**: Event handling, keyboard navigation, inline editing
- **`device-management-main.js`**: System initialization, component orchestration

### **State Management**
All state is managed in the `window.DeviceManagement` namespace:
```javascript
DM.state = {
  currentDataSourceUid: 'sqlite-demo',
  editingCell: null,
  originalValues: {},
  tableStructure: null,
  currentFocusedInput: null
};
```

## 🎨 Customization Examples

### **Adding New Validation Rules**
Edit `device-management-utils.js`:
```javascript
DM.validateInput = function(input, theme) {
  // Add your custom validation logic
  if (fieldName === 'email' && !isValidEmail(value)) {
    // Set error styling
    return false;
  }
  return true;
};
```

### **Enhancing Table Styling**
Edit `device-management-table.css`:
```css
.devices-table tbody tr:hover {
  background: var(--action-hover);
  transform: scale(1.02); /* Add subtle hover effect */
}
```

### **Adding New CRUD Operations**
Edit `device-management-crud.js`:
```javascript
DM.crud.bulkUpdate = async function(updates) {
  // Add bulk update functionality
};
```

## 🔍 Debugging Tips

### **Component Loading Issues**
- Check browser network tab for failed requests
- Verify static service is running: `docker-compose ps`
- Ensure files exist in `example/` directory

### **Functionality Problems**
- Check browser console for JavaScript errors
- Verify all modules loaded: `console.log(window.DeviceManagement)`
- Test individual components in browser DevTools

### **Styling Issues**
- Inspect elements to see which CSS rules apply
- Check CSS variable values in different themes
- Verify CSS files loaded in Network tab

## 📚 Business Text Plugin Integration

This example showcases the full power of the Business Text plugin (by Volkov Labs), demonstrating advanced features for building rich, interactive dashboards with external content loading and dynamic functionality.

### **🔧 Plugin Configuration Fields**

#### **Content Management**
- **`content`**: Main HTML content displayed in the panel
- **`defaultContent`**: Fallback content when no data or errors occur
- **`contentPartials`**: Reusable HTML snippets for templating
- **`wrap`**: Enable/disable content wrapping in containers

#### **Remote Loading System**
- **`afterRenderRemoteUrl`**: External JavaScript file URL executed after rendering
- **`stylesRemoteUrl`**: External CSS file URL for styling
- **`helpersRemoteUrl`**: External helper function libraries
- **`externalStyles[]`**: Array of external CSS URLs (CDNs, stylesheets)

#### **Inline Code Options**
- **`afterRender`**: JavaScript code executed after content rendering
- **`helpers`**: Custom helper functions for templating
- **`styles`**: Inline CSS styles for panel customization

#### **Editor & Development**
- **`editor.language`**: Code editor syntax highlighting (html, javascript, css)
- **`editor.format`**: Auto-formatting options (auto, manual)
- **`wrap`**: Content wrapping and overflow handling

#### **Data Integration**
- **`dataSource.enableDataSourceQueries`**: Enable data source API access
- **`dataSource.queryTimeout`**: Query timeout in milliseconds
- **`dataSource.uid`**: Specific data source identifier

### **🌐 Remote Content Loading Capabilities**

#### **JavaScript Remote Loading**
```javascript
// afterRenderRemoteUrl loads external JS files
"afterRenderRemoteUrl": "http://static/device-management-loader.js"

// Supports:
- Module loading and dependency management
- Async/await operations with data sources
- Event handling and DOM manipulation
- State management across panel refreshes
- Error handling and graceful degradation
```

#### **CSS Remote Loading**
```javascript
// stylesRemoteUrl for external stylesheets
"stylesRemoteUrl": "http://static/styles.css"

// externalStyles for multiple CSS sources
"externalStyles": [
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "http://static/custom-theme.css"
]

// Supports:
- CDN resources (FontAwesome, Bootstrap, etc.)
- Custom theme integration
- Responsive design frameworks
- Icon libraries and web fonts
```

#### **HTML Content Loading**
```javascript
// Dynamic HTML fetching within JavaScript
const response = await fetch('http://static/content.html');
const html = await response.text();
document.getElementById('container').innerHTML = html;

// Supports:
- Template-based content loading
- Conditional content rendering
- Multi-language content switching
- Component-based architecture
```

### **🎯 Advanced Integration Features**

#### **Grafana Context API**
```javascript
// Available via window.context in afterRender/remote scripts
window.context = {
  theme: {
    colors: { /* Grafana theme colors */ },
    typography: { /* Font settings */ },
    spacing: function(multiplier) { /* Spacing utility */ }
  },
  dataSource: {
    sql: async function(uid, query) { /* Execute SQL queries */ },
    utils: {
      toObjects: function(result) { /* Convert results to objects */ }
    }
  },
  grafana: {
    notifySuccess: function(message) { /* Success notifications */ },
    notifyError: function(message) { /* Error notifications */ }
  }
}
```

#### **Theme Integration**
```css
/* CSS Variables automatically available */
:root {
  --primary-color: /* Grafana primary color */;
  --background-color: /* Panel background */;
  --text-color: /* Primary text color */;
  --border-color: /* Border color */;
  /* 50+ CSS variables for complete theme integration */
}
```

#### **Data Source Operations**
```javascript
// Full SQL support for multiple database types
const result = await context.dataSource.sql('sqlite-demo', 'SELECT * FROM devices');
const rows = context.dataSource.utils.toObjects(result);

// Supports:
- SQLite, PostgreSQL, MySQL, InfluxDB
- Parameterized queries and prepared statements
- Transaction support
- Real-time data updates
- Error handling and connection management
```

### **📋 Panel Configuration Options**

#### **Essential Settings**
- **Panel Type**: `volkovlabs-text-panel` (Business Text)
- **Title**: Display name for the panel
- **Description**: Panel description for documentation
- **Transparent Background**: Remove panel borders and background

#### **Advanced Options**
- **Refresh Settings**: Auto-refresh intervals and manual refresh
- **Time Range**: Panel-specific time range overrides
- **Variables**: Dashboard variable integration
- **Links**: Panel link navigation and interactions

#### **Performance Tuning**
- **Query Timeout**: Adjust for long-running operations
- **Caching Strategy**: Browser and CDN caching optimization
- **Resource Loading**: Parallel vs sequential loading
- **Error Recovery**: Fallback content and retry mechanisms

### **🔨 Development Best Practices**

#### **File Organization**
```
example/
├── device-management-core.css        # Base UI components
├── device-management-table.css       # Specialized table styles
├── device-management-utils.js        # Shared utilities
├── device-management-crud.js         # Database operations
├── device-management-ui.js           # User interactions
├── device-management-main.js         # System initialization
├── device-management-loader.js       # Component orchestrator
└── device-management-content.html    # HTML structure
```

#### **Error Handling Strategy**
```javascript
// Multi-level fallback system
1. Remote loader (primary)
2. Local afterRender (fallback)
3. Default content (ultimate fallback)
4. User notifications (error reporting)
```

#### **Security Considerations**
```javascript
// Content Security Policy compliance
- Use HTTPS for external resources
- Validate all user inputs
- Sanitize HTML content
- Implement proper error boundaries
- Log security events appropriately
```

### **🚀 Production Deployment**

#### **Static File Serving**
```yaml
# docker-compose.yml
services:
  static:
    image: kugland/darkhttpd:latest
    volumes:
      - ./example:/www:ro
    # Serves files at http://static/filename.ext
```

#### **CDN Integration**
```javascript
// External resources via CDN
"externalStyles": [
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
]
// Benefits: Faster loading, better caching, reduced server load
```

#### **Monitoring & Analytics**
```javascript
// Performance monitoring
console.time('Component Loading');
// ... component loading logic
console.timeEnd('Component Loading');

// Error tracking
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Send to monitoring service
});
```

### **🎨 Advanced Styling Techniques**

#### **Responsive Design**
```css
/* Mobile-first approach */
.device-table {
  width: 100%;
  overflow-x: auto;
}

@media (min-width: 768px) {
  .device-table {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}
```

#### **Dark/Light Theme Support**
```css
/* Automatic theme switching */
.panel-content {
  background: var(--background-color);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

/* Theme-specific overrides */
[data-theme="dark"] .custom-element {
  box-shadow: 0 2px 8px rgba(255,255,255,0.1);
}
```

### **💡 Innovation Examples**

This implementation demonstrates cutting-edge Business Text plugin usage:

1. **Modular Architecture**: 9 separate files working as a cohesive system
2. **Remote Component Loading**: Dynamic dependency resolution
3. **Graceful Degradation**: Multiple fallback layers
4. **Real-time CRUD**: Live database operations with validation
5. **Advanced UI/UX**: Frozen columns, keyboard navigation, inline editing
6. **Theme Integration**: Seamless Grafana theme compliance
7. **Error Recovery**: Comprehensive error handling and user feedback
8. **Performance Optimization**: Parallel loading and minimal fallbacks

## 🎯 AI Development Context

This modular structure is specifically designed for AI-assisted development:

### **When to Use Each File**
- **Styling Changes**: Start with CSS files
- **Database Logic**: Focus on `crud.js`
- **User Experience**: Work with `ui.js`
- **New Features**: Begin with `utils.js` for shared functionality

### **Common Development Patterns**
1. **Feature Addition**: utils.js → crud.js/ui.js → main.js
2. **Bug Fixes**: Identify module → make focused changes → test
3. **Styling Updates**: CSS files → test across themes
4. **Performance**: Review component loading and state management

### **Integration Points**
- **Grafana Context**: Available via `window.context`
- **Theme System**: CSS variables for consistent styling
- **Data Source**: SQLite operations via plugin API
- **State**: Centralized in `DeviceManagement` namespace

This modular approach transforms a complex, monolithic dashboard into a maintainable, scalable system that's perfect for iterative AI-driven development while preserving all original functionality.