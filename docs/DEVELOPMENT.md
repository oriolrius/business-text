# Development Guide

## Project Structure

```txt
business-text/
├── 📁 .config/          # Grafana scaffolded configuration
│   ├── webpack/         # Webpack build configuration
│   ├── jest/            # Jest test configuration
│   └── types/           # TypeScript definitions
├── 📁 .github/          # GitHub workflows and CI/CD
├── 📁 backend/          # Go backend components
│   ├── go.mod           # Go module definition
│   ├── go.sum           # Go dependencies lockfile
│   ├── magefile.go      # Mage build tool
│   └── pkg/             # Go packages
├── 📁 docs/             # Documentation
│   └── BACKEND.md       # Backend-specific documentation
├── 📁 docker/           # Docker configuration
├── 📁 scripts/          # Build and utility scripts
├── 📁 src/              # Frontend source code
│   ├── components/      # React components
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── hooks/           # React hooks
│   ├── constants/       # Application constants
│   ├── __mocks__/       # Jest mocks
│   ├── module.ts        # Main plugin module
│   └── plugin.json      # Plugin metadata
├── 📁 static/           # Static assets
├── 📁 test/             # E2E tests (Playwright)
├── 📄 CHANGELOG.md      # Version history
├── 📄 LICENSE           # License file
├── 📄 README.md         # Main documentation
├── 📄 package.json      # Node.js dependencies
├── 📄 tsconfig.json     # TypeScript configuration
└── 📄 webpack.config.ts # Webpack build configuration
```

## Development Commands

### Setup

```bash
# Install dependencies
npm install

# Install Go dependencies (for backend)
go mod download
```

### Development

```bash
# Start frontend development server
npm run dev

# Start backend development server
npm run dev:backend

# Start both frontend and backend
npm run dev:full
```

### Building

```bash
# Build frontend
npm run build

# Build backend
npm run build:backend

# Build both (using script)
./scripts/build.sh
```

### Testing

```bash
# Run unit tests
npm test

# Run unit tests with coverage
npm run test:ci

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:dev
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Check TypeScript types
npm run typecheck
```

## Development Workflow

1. **Frontend Development**: Edit files in `src/` directory
2. **Backend Development**: Edit files in `backend/` directory  
3. **Testing**: Write unit tests alongside source files, E2E tests in `test/`
4. **Documentation**: Update `docs/` for backend, `README.md` for general docs
5. **Configuration**: Modify `.config/` files for build settings

## Key Files

- `src/module.ts` - Main plugin entry point
- `src/plugin.json` - Plugin metadata and configuration
- `backend/pkg/main.go` - Backend entry point
- `webpack.config.ts` - Custom webpack configuration
- `playwright.config.ts` - E2E test configuration

## Notes

- Unit tests are co-located with source files
- E2E tests are in the `test/` directory
- Configuration follows Grafana plugin conventions
- Backend is optional and can be disabled
