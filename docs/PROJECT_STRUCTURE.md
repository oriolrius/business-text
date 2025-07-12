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
