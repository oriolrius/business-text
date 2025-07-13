# Project Structure Documentation

This document describes the current structure of the Grafana Business Text plugin repository and where to find different types of files and components.

## Repository Overview

This is a Grafana panel plugin that provides data-driven text rendering with Markdown and Handlebars support. The repository is organized into distinct sections for frontend, backend, configuration, tests, and documentation.

## Directory Structure

### Root Directory

- **`package.json`** - Node.js project configuration, dependencies, and npm scripts
- **`pnpm-lock.yaml`** & **`pnpm-workspace.yaml`** - PNPM package manager configuration
- **`tsconfig.json`** - TypeScript configuration (extends `.config/tsconfig.json`)
- **`webpack.config.js`** - Webpack entry point (extends `.config/webpack/webpack.config.ts`)
- **`playwright.config.ts`** - Playwright E2E test configuration
- **`jest.config.js`** & **`jest-setup.js`** - Jest unit test configuration
- **`README.md`** - Project overview and setup instructions
- **`CHANGELOG.md`** - Version history and release notes
- **`LICENSE`** - Apache 2.0 license

**Note**: The webpack configuration uses JavaScript to avoid TypeScript compilation issues with the Grafana scaffolded base config while maintaining full functionality.

### Frontend Source Code (`src/`)

All frontend TypeScript/React code is located in the `src/` directory:

#### Core Files

- **`module.ts`** - Main plugin module entry point
- **`migration.ts`** - Data migration logic for plugin updates
- **`plugin.json`** - Grafana plugin metadata

#### Components (`src/components/`)

- **`TextPanel/`** - Main panel component that renders the text content
- **`Text/`** - Core text rendering component with Markdown/Handlebars support
- **`CustomEditor/`** - Panel editor components for configuration
- **`ContentPartialsEditor/`** - Editor for managing Handlebars partials
- **`ResourcesEditor/`** - Editor for external CSS/JS resources
- **`Row/`** - Row component for layout

#### Type Definitions (`src/types/`)

- **`panel.ts`** - Panel configuration and options types
- **`editor.ts`** - Editor-specific types
- **`resource.ts`** - External resource types
- **`index.ts`** - Type exports

#### Utilities (`src/utils/`)

- **`code.ts`** - Code syntax highlighting utilities
- **`handlebars.ts`** - Handlebars template processing
- **`html.ts`** - HTML sanitization and processing
- **`partials.ts`** - Handlebars partials management
- **`rows.ts`** - Row layout utilities
- **`variable.ts`** - Grafana variable handling
- **`external-resources.ts`** - External CSS/JS resource loading
- **`code-parameters.ts`** - Code parameter utilities

#### React Hooks (`src/hooks/`)

- **`useExternalResources.ts`** - Hook for loading external resources

#### Constants (`src/constants/`)

- **`default.ts`** - Default configuration values
- **`editor.ts`** - Editor constants
- **`panel.ts`** - Panel constants
- **`highlight.ts`** - Syntax highlighting constants
- **`tests.ts`** - Test constants

#### Tests (`src/`)

Unit tests are co-located with their source files:

- **`*.test.ts`** - TypeScript unit tests
- **`*.test.tsx`** - React component tests

#### Mocks (`src/__mocks__/`)

- **`@grafana/`** - Mocked Grafana modules for testing

#### Assets (`src/img/`)

- **`logo.svg`** - Plugin logo
- **`screenshot.png`** - Plugin screenshot

#### Type Declarations (`src/@types/`)

- **`helper-date.d.ts`** - External library type declarations
- **`webpack-livereload-plugin.d.ts`** - Type declarations for webpack LiveReload plugin
- **`replace-in-file-webpack-plugin.d.ts`** - Type declarations for webpack replace-in-file plugin

### Backend (`backend/`)

Go backend code for server-side functionality:

- **`go.mod`** & **`go.sum`** - Go module configuration (defines the module root)
- **`magefile.go`** - Mage build configuration
- **`pkg/main.go`** - Go backend entry point

**Note**: All Go commands must be run from the `backend/` directory since that's where the Go module is defined.

**Backend Development**: The backend is a Grafana plugin that implements resource handlers for server-side functionality. When you run `npm run dev:backend`, it will show "This binary is a plugin" and exit - this is expected behavior since plugin backends are designed to be loaded by Grafana, not run independently.

### Configuration (`.config/`)

All build and development configuration files:

#### Webpack

- **`webpack/webpack.config.ts`** - Main webpack configuration

#### Jest

- **`jest/`** - Jest configuration directory with mocks and utilities

#### TypeScript

- **`tsconfig.json`** - TypeScript compiler configuration

#### ESLint & Prettier

- **`.eslintrc`** - ESLint configuration
- **`.prettierrc.js`** - Prettier code formatting configuration

### End-to-End Tests (`test/`)

Playwright E2E tests and related files:

- **`panel.spec.ts`** - Main panel E2E tests
- **`panel.spec.ts-snapshots/`** - Visual regression test screenshots
- **`utils/`** - E2E test utilities and selectors
- **`Dockerfile`** - Docker configuration for E2E testing

### Documentation (`docs/`)

Project documentation:

- **`DEVELOPMENT.md`** - Development setup and guidelines
- **`BACKEND.md`** - Backend-specific documentation
- **`PROJECT_STRUCTURE.md`** - This file

### Build Scripts (`scripts/`)

- **`build.sh`** - Main build script for CI/CD

### Docker Configuration

- **`docker-compose.yml`** - Docker Compose configuration for development (located at project root)

**Note**: The docker-compose.yml file is located at the project root and includes multiple profiles for different development scenarios:

- `dev` profile: Uses volkovlabs/app image for development
- `main` profile: Uses latest Grafana main branch  
- `dependency` profile: Uses specific Grafana version for compatibility testing
- `e2e` profile: For end-to-end testing with Playwright

### Static Assets (`static/`)

- **`img/`** - Static images and screenshots
- **`coverage/`** - Test coverage reports
- **`provisioning/`** - Grafana provisioning configuration

## Key File Locations

### Finding Specific Components

| What you're looking for | Where to find it |
|-------------------------|-------------------|
| Panel rendering logic | `src/components/TextPanel/` |
| Text processing | `src/components/Text/` |
| Panel configuration | `src/types/panel.ts` |
| Editor components | `src/components/CustomEditor/` |
| Handlebars helpers | `src/utils/handlebars.ts` |
| External resource loading | `src/utils/external-resources.ts` |
| Unit tests | Co-located with source files (`.test.ts` files) |
| E2E tests | `test/panel.spec.ts` |
| Build configuration | `.config/webpack/webpack.config.ts` |
| Backend API | `backend/pkg/main.go` |
| Plugin metadata | `src/plugin.json` |

### Development Commands

All development commands are defined in `package.json` scripts:

- **Frontend development**: `npm run dev`
- **Backend development**: `npm run dev:backend`  
- **Full stack development**: `npm run dev:full`
- **Build**: `npm run build`
- **Unit tests**: `npm run test`
- **E2E tests**: `npm run test:e2e`
- **Linting**: `npm run lint`

**Note**: Backend commands automatically change to the `backend/` directory where the Go module is defined.

**Important**: When running `npm run dev:backend`, you'll see a message like "This binary is a plugin. These are not meant to be executed directly." This is **normal behavior** - Grafana plugin backends are meant to be loaded by Grafana, not run standalone. The command successfully builds and validates the backend code.

### Configuration Files

- **TypeScript**: Root `tsconfig.json` extends `.config/tsconfig.json`
- **Webpack**: Root `webpack.config.js` extends `.config/webpack/webpack.config.ts` with custom Handlebars configuration
- **Jest**: `jest.config.js` references Jest configuration with mocks in `.config/jest/`
- **ESLint**: `.eslintrc` (references `.config/.eslintrc`)
- **Prettier**: `.prettierrc.js` (references `.config/.prettierrc.js`)

**Note**: The webpack configuration uses JavaScript to avoid TypeScript compilation issues while maintaining all custom functionality including Handlebars alias configuration. TypeScript version is set to 5.3.3 for compatibility with @typescript-eslint/typescript-estree. ESLint configuration includes proper file coverage for both src/ files and configuration files.

This structure follows Grafana plugin best practices and provides clear separation of concerns between frontend, backend, configuration, and testing code.

## CSS Libraries and Styling System

### Grafana Native Styling System

The Business Text panel uses **Grafana's native styling system** built on **Emotion CSS-in-JS** and **GrafanaTheme2**. This provides automatic theme switching (light/dark) and consistent look-and-feel with the rest of Grafana.

#### Core Dependencies

- **`@emotion/css`** - Primary CSS-in-JS library for component styling
- **`@grafana/ui`** - Pre-built UI components (Button, Icon, Input, Select, etc.)
- **`GrafanaTheme2`** - Unified theme system with automatic light/dark mode switching
- **`useStyles2`** - Hook for theme-aware styling
- **`useTheme2`** - Hook for accessing theme object directly

#### Grafana Theme Object (GrafanaTheme2)

Access theme variables using the `useTheme2()` hook in your JavaScript code:

```javascript
// Available in "After Content Ready" context
const theme = context.grafana.theme;

// Theme color categories
theme.colors.primary.main      // Primary brand color
theme.colors.secondary.main    // Secondary color
theme.colors.success.main      // Green success color
theme.colors.error.main        // Red error color
theme.colors.warning.main      // Orange warning color
theme.colors.info.main         // Blue info color

// Text colors
theme.colors.text.primary      // Main text color
theme.colors.text.secondary    // Dimmed text color
theme.colors.text.disabled     // Disabled text color
theme.colors.text.link         // Link color

// Background colors
theme.colors.background.canvas    // Dashboard background
theme.colors.background.primary   // Main content background
theme.colors.background.secondary // Card/panel backgrounds

// Border colors
theme.colors.border.weak     // Subtle borders
theme.colors.border.medium   // Standard borders  
theme.colors.border.strong   // Emphasized borders

// Action colors
theme.colors.action.hover    // Hover background
theme.colors.action.focus    // Focus background
theme.colors.action.selected // Selected background

// Spacing (returns pixel values)
theme.spacing(1)             // 8px
theme.spacing(2)             // 16px
theme.spacing(1, 2)          // 8px 16px
theme.spacing(1, 2, 0.5, 4)  // 8px 16px 4px 32px

// Typography
theme.typography.h1.fontSize     // Heading sizes
theme.typography.body.fontSize   // Body text size
theme.typography.fontFamily      // Font family
theme.typography.fontWeightMedium // Font weights

// Border radius
theme.shape.borderRadius(1)  // 2px
theme.shape.borderRadius(2)  // 4px
```

#### Built-in Grafana UI Components

**Available Components from @grafana/ui:**

| Component | Usage | Example |
|-----------|-------|---------|
| `Button` | Primary actions | `import { Button } from '@grafana/ui'` |
| `Icon` | Consistent icons | `<Icon name="plus" />` |
| `Input` | Form inputs | `<Input placeholder="Enter text" />` |
| `Select` | Dropdown selection | `<Select options={opts} />` |
| `Alert` | Status messages | `<Alert title="Warning" />` |
| `LoadingBar` | Progress indication | `<LoadingBar />` |
| `Checkbox` | Boolean selection | `<Checkbox />` |
| `InlineField` | Form layout | For form row layouts |
| `InlineFieldRow` | Form row layout | Groups form fields |

**Reference:** [Grafana UI Storybook](https://developers.grafana.com/ui/canary/)

#### Using Grafana Theme in Custom CSS

**Method 1: CSS Custom Properties (Recommended)**

Use Grafana's CSS variables in your custom styles:

```css
/* Use theme variables - automatically switches with light/dark mode */
.my-button {
  background: var(--primary-color);
  color: var(--primary-text-color);
  border: 1px solid var(--border-medium);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-default);
}

.my-card {
  background: var(--background-secondary);
  border: 1px solid var(--border-weak);
  box-shadow: var(--shadow-z1);
}

.my-text {
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-sans-serif);
}
```

**Method 2: Theme Object in JavaScript**

Access theme in your "After Content Ready" code:

```javascript
// Get theme object
const theme = context.grafana.theme;

// Apply styles dynamically
document.querySelector('.my-element').style.cssText = `
  background: ${theme.colors.background.secondary};
  color: ${theme.colors.text.primary};
  border: 1px solid ${theme.colors.border.medium};
  padding: ${theme.spacing(1)}px;
`;

// Create theme-aware CSS classes
const css = `
  .theme-button {
    background: ${theme.colors.primary.main};
    color: ${theme.colors.primary.contrastText};
    border: none;
    padding: ${theme.spacing(1, 2)};
    border-radius: ${theme.shape.borderRadius(1)}px;
    font-family: ${theme.typography.fontFamily};
  }
  
  .theme-button:hover {
    background: ${theme.colors.primary.shade};
  }
`;

// Inject theme-aware styles
const style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);
```

#### Panel-Specific CSS Classes

| CSS Class | Location | Purpose |
|-----------|----------|---------|
| `.dt-row` | Applied to each content row | Main container for rendered content |
| `.hljs` | Code highlighting | Syntax highlighting for code blocks |

**Internal Style Files:**
- `src/constants/highlight.ts` - A11Y-compliant syntax highlighting themes
- `src/components/Text/Text.styles.ts` - Core text rendering with theme integration
- `src/components/TextPanel/TextPanel.styles.ts` - Panel container styles

### External CSS Libraries

#### Adding External Libraries

**Method 1: Panel Configuration**
1. Panel options → **CSS Styles** → **External Styles**
2. Add CDN URL
3. Save panel

**Method 2: JavaScript (Dynamic Loading)**
```javascript
// Load external CSS dynamically
function loadCSS(url) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

// Example: Load Bootstrap
loadCSS('https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css');
```

#### Compatible CSS Frameworks

| Framework | CDN URL | Best For |
|-----------|---------|----------|
| **Bootstrap** | `https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css` | Full UI framework |
| **Tailwind CSS** | `https://cdn.tailwindcss.com` | Utility-first styling |
| **Bulma** | `https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css` | Modern CSS framework |
| **W3.CSS** | `https://www.w3schools.com/w3css/4/w3.css` | Lightweight framework |

**Note:** External frameworks may conflict with Grafana's theme. Prefer Grafana's native styling for consistency.

### Best Practices

#### 1. Use Grafana Native Styling (Recommended)

```css
/* ✅ Good - Uses Grafana theme variables */
.my-button {
  background: var(--primary-color);
  color: var(--primary-text-color);
  border: 1px solid var(--border-medium);
}

/* ❌ Avoid - Hard-coded colors break theme switching */
.my-button {
  background: #0066cc;
  color: white;
  border: 1px solid #ccc;
}
```

#### 2. Theme-Aware JavaScript

```javascript
// ✅ Good - Responsive to theme changes
const theme = context.grafana.theme;
element.style.background = theme.colors.background.secondary;

// ❌ Avoid - Fixed colors
element.style.background = '#f5f5f5';
```

#### 3. Test Both Themes

Always test your styles in both light and dark Grafana themes:
- Use theme variables instead of hard-coded colors
- Check contrast ratios for accessibility
- Verify hover/focus states work in both themes

#### 4. Component Hierarchy

1. **First choice:** Use `@grafana/ui` components
2. **Second choice:** Use Grafana theme variables
3. **Last resort:** External CSS frameworks

### CSS Variable Reference

**Common Grafana CSS Variables:**

```css
/* Colors */
--primary-color
--secondary-color
--success-color
--error-color
--warning-color
--info-color

/* Text */
--text-primary
--text-secondary
--text-disabled
--text-link

/* Backgrounds */
--background-canvas
--background-primary
--background-secondary

/* Borders */
--border-weak
--border-medium
--border-strong

/* Spacing */
--spacing-xs    /* 4px */
--spacing-sm    /* 8px */
--spacing-md    /* 16px */
--spacing-lg    /* 24px */
--spacing-xl    /* 32px */

/* Typography */
--font-family-sans-serif
--font-size-xs
--font-size-sm
--font-size-md
--font-size-lg

/* Border radius */
--border-radius-default
--border-radius-sm
--border-radius-lg
```

### CSS File Locations

| Type | Location | Purpose |
|------|----------|---------|
| **Component Styles** | `src/components/*/styles.ts` | Emotion CSS-in-JS component styles |
| **Theme Constants** | `src/constants/highlight.ts` | Syntax highlighting themes |
| **External CSS** | Panel configuration | URLs to external CSS libraries |
| **Custom CSS** | Panel options → Styles | User-defined CSS for panel content |
| **Example Configurations** | `provisioning/dashboards/` | Demo panels with CSS library examples |

### Best Practices

1. **Use External Libraries** for comprehensive UI frameworks (Bootstrap, W3.CSS)
2. **Use Custom CSS** for specific styling needs and brand customization
3. **Use Internal Classes** (`dt-row`) to target panel content specifically
4. **Test in Both Themes** - Ensure styles work in light and dark Grafana themes
5. **Leverage Grafana Variables** - Use CSS variables for dynamic theming
6. **Performance** - External CSS is loaded once and cached by the browser

### Troubleshooting CSS

**Common Issues:**

- **Styles not applying**: Check CSS specificity and ensure external libraries are loaded
- **Theme conflicts**: Use `!important` sparingly, prefer theme-aware CSS variables
- **External library not loading**: Verify CDN URLs and check browser console for errors
- **Mobile responsiveness**: Test styles on different screen sizes

**Debug CSS Loading:**

1. Open browser Developer Tools → Network tab
2. Reload panel to see if external CSS files load successfully
3. Check Console for CSS-related errors
4. Use Elements tab to inspect applied styles
