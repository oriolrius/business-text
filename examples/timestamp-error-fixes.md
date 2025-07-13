# Timestamp and Error Handling Fixes

## Issues Fixed

### 1. **Timestamp Field Handling**
**Problem**: PostgreSQL was receiving timestamp values as strings (e.g., `'1748927482567'`) instead of proper timestamp format, causing "date/time field value out of range" errors.

**Solution**: Added intelligent data type detection and formatting:

```javascript
function formatSqlValue(fieldName, value) {
  // Detect timestamp fields by common patterns
  const timestampPatterns = [
    /.*_at$/i,        // created_at, updated_at, last_seen_at
    /.*_time$/i,      // start_time, end_time
    /.*timestamp$/i,  // timestamp fields
    /^date$/i,        // date field
    /^time$/i         // time field
  ];
  
  if (isTimestampField) {
    // Convert Unix timestamp to PostgreSQL format
    if (/^\d{10,13}$/.test(stringValue)) {
      const timestamp = parseInt(stringValue);
      const date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);
      return `'${date.toISOString()}'`; // Proper PostgreSQL timestamp
    }
  }
  
  // Handle other data types appropriately
  return `'${stringValue.replace(/'/g, "''")}'`; // Escaped strings
}
```

### 2. **Enhanced Error Handling & Notifications**
**Problem**: Error notifications only showed "D\ne" instead of meaningful error messages.

**Solution**: Comprehensive error parsing and user-friendly notifications:

```javascript
catch (error) {
  let errorMessage = 'Unknown error occurred';
  let errorDetails = '';
  
  // Parse Grafana error structure
  if (error && error.data && error.data.results) {
    const results = error.data.results;
    Object.keys(results).forEach(key => {
      const result = results[key];
      if (result.error) {
        errorMessage = result.error;
        if (result.errorSource) {
          errorDetails += `Source: ${result.errorSource}. `;
        }
        
        // Log executed query for debugging
        const executedQuery = result.frames[0]?.schema?.meta?.executedQueryString;
        if (executedQuery) {
          console.error('Failed SQL Query:', executedQuery);
        }
      }
    });
  }
  
  // Show comprehensive error notification
  const fullErrorMessage = `Update failed: ${errorMessage}${errorDetails ? ' | ' + errorDetails : ''}`;
  context.grafana.notifyError(fullErrorMessage);
}
```

### 3. **Real-Time Timestamp Validation**
**Added**: Input validation with immediate feedback for timestamp fields:

```javascript
function validateInput(input, theme) {
  const fieldName = input.getAttribute('data-field');
  const isTimestampField = timestampPatterns.some(pattern => pattern.test(fieldName));
  
  if (isTimestampField) {
    // Validate Unix timestamp format
    if (/^\d{10,13}$/.test(value)) {
      const date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);
      input.title = `Will be saved as: ${date.toISOString()}`;
      input.style.borderColor = theme.colors.success.main;
      return true;
    }
    
    // Validate ISO date format
    const parsedDate = new Date(value);
    if (!isNaN(parsedDate.getTime())) {
      input.title = `Will be saved as: ${parsedDate.toISOString()}`;
      input.style.borderColor = theme.colors.success.main;
      return true;
    }
    
    // Show error for invalid format
    input.style.borderColor = theme.colors.error.main;
    input.title = 'Invalid date/time format. Use Unix timestamp or ISO date';
    return false;
  }
}
```

## Data Type Handling Improvements

### **Automatic Type Detection**
- **Timestamps**: `created_at`, `updated_at`, `last_seen_at`, `start_time`, etc.
- **Numbers**: Detects numeric values and removes quotes
- **Booleans**: Handles `true`/`false` values
- **Nulls**: Properly handles `null`, `'null'`, and empty values
- **Strings**: Default with proper SQL escaping

### **Input Field Enhancements**
- **Placeholders**: Timestamp fields show format examples
- **Tooltips**: Real-time preview of how values will be saved
- **Visual Feedback**: Green borders for valid timestamps, red for invalid
- **Format Guidance**: Clear instructions for timestamp formats

## Error Notification Improvements

### **Before**: 
- Cryptic messages like "D\ne"
- No context about what failed
- No debugging information

### **After**:
- Clear error descriptions: `"Update failed: date/time field value out of range"`
- Context information: `"Source: downstream"`
- SQL query logging for debugging
- Detailed console error logs
- User-friendly fallback notifications

## Example Error Messages

### **Database Error**:
```
Update failed: pq: date/time field value out of range: "1748927482567" | Source: downstream
```

### **Validation Error**:
```
Please fix validation errors before saving
```

### **Network Error**:
```
Update failed: Network request failed | Check your connection
```

## Usage Examples

### **Valid Timestamp Formats**:
- Unix timestamp: `1671234567` (10 digits) or `1671234567000` (13 digits)
- ISO format: `2023-12-17T10:30:00Z`
- Human readable: `2023-12-17 10:30:00`

### **Real-Time Feedback**:
1. User types `1671234567` in `created_at` field
2. Field border turns green
3. Tooltip shows: "Will be saved as: 2022-12-17T10:29:27.000Z"
4. User can proceed with confidence

The system now properly handles PostgreSQL data types and provides clear, actionable error messages for better debugging and user experience.
