# Backend HTTP Fetching for Business Text Plugin

This plugin now includes a Go backend that enables server-side HTTP requests to fetch external content without CORS limitations.

## ✅ Implementation Status

**COMPLETED**: The backend implementation is fully functional and integrated with the development workflow.

- ✅ Go backend with `/fetch-content` resource endpoint
- ✅ Frontend integration with `fetchHtmlViaBackend` function
- ✅ Multi-tier fallback strategy (backend → proxy → direct)
- ✅ Build scripts for both development and production
- ✅ Development workflow (`npm run dev`) working correctly
- ✅ Backend binary compilation and integration

## How it works

1. **Frontend calls backend**: When the plugin needs to fetch external content (like HTML partials), it makes a POST request to `/api/plugins/volkovlabs-text-panel/resources/fetch-content`

2. **Backend fetches content**: The Go backend receives the request and makes an HTTP GET request to the specified URL using the server's network context

3. **Content returned**: The fetched content is returned to the frontend as JSON

## Advantages

- **No CORS issues**: Since the HTTP request is made server-side by Grafana, it bypasses browser CORS restrictions
- **Better security**: External requests are made by the Grafana server, not the user's browser
- **No browser fetch**: Eliminates the need for browser-based fetch calls
- **Proper error handling**: Server-side error handling and logging

## API Endpoint

### POST `/api/plugins/volkovlabs-text-panel/resources/fetch-content`

**Request Body:**
```json
{
  "url": "https://example.com/template.html"
}
```

**Response:**
```json
{
  "content": "<html>...</html>"
}
```

**Error Response:**
```json
{
  "error": "Failed to fetch content: network error"
}
```

## Fallback Strategy

The plugin uses a multi-tier fallback strategy:

1. **Backend method** (primary): Server-side HTTP requests via the plugin backend
2. **Proxy method** (fallback): Grafana datasource proxy (requires datasource configuration)
3. **Direct method** (last resort): Browser fetch (requires CORS to be enabled on target server)

## Building the Plugin

To build both frontend and backend:

```bash
npm run build
```

To build only the backend:

```bash
npm run build:backend
```

## Development

To run the backend in development mode:

```bash
npm run backend:dev
```

This will start the Go backend that can be used with your Grafana development instance.

## Plugin Configuration

Update your `plugin.json` to include:

```json
{
  "backend": true,
  "executable": "gpx_business-text"
}
```

This tells Grafana that the plugin has a backend component that should be started when the plugin is loaded.

**Note**: Grafana automatically appends platform-specific suffixes to the executable name (e.g., `_linux_amd64`), so the build script creates `gpx_business-text_linux_amd64` to match Grafana's expectations.

## ✅ Verification

To verify the backend is working correctly:

1. **Development Mode**: Run `npm run dev` - this will build the backend and start webpack in watch mode
2. **Production Build**: Run `npm run build` - this will build both frontend and backend components
3. **Test the Integration**: The plugin will automatically use the backend method first, falling back to proxy/direct methods if needed

## Next Steps

The implementation is complete and ready for use. The plugin will now:

- Automatically fetch external HTML partials server-side (no CORS issues)
- Fallback gracefully to alternative methods if the backend is unavailable
- Work seamlessly in both development and production environments

For usage in a production Grafana instance, simply install the plugin with the built backend binary, and Grafana will automatically start the backend component when the plugin loads.
