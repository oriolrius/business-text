# Get the latest version of Playwright
FROM mcr.microsoft.com/playwright:v1.54.0-jammy

# Set the work directory for the application
WORKDIR app

# Install pnpm globally
RUN npm install -g pnpm

# COPY the needed files to the app folder in Docker image
COPY .. .

# Install the dependencies using pnpm
RUN yes | pnpm install

# Install browsers
RUN npx playwright install --with-deps chromium

# Run tests with a small delay to ensure Grafana is fully ready
CMD ["sh", "-c", "sleep 10 && pnpm run test:e2e"]
