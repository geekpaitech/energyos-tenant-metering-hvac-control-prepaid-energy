# Digital IoT Energy Management Frontend

A Vue 2 / Vue CLI 4 frontend for device management, energy reporting, billing, finance, tenant management, AI assistance, and dashboards.

The complete application requires compatible backend APIs, account permissions, and the existing external services. Backend implementations are not included in this repository.

## Getting started

Use **Node.js 14.21.3 and npm 6.14.18** as the validation baseline. Nearby Node.js 14.x versions require their own verification. Keep the existing dependency versions and the committed `package-lock.json`.

```bash
npm ci
npm run serve
```

The default local address is `http://localhost:8080`.

## Configuration

Edit `vue.config.js`:

- `services.backendRoot`: main backend, default `https://iot-test.geekpartytech.com`. This controls both the development `/api` proxy and production requests, including voucher uploads.
- Other `services` entries: AI, statistics, EMS, building management, parking, tenant portal, permission page link, and main request timeout. Existing defaults are preserved.
- `features`: global and region Mock settings. Existing data sources are preserved.
- `devServer`: port, automatic browser opening, local HTTPS, and development proxy.
- `publicPath`: frontend deployment path, default `/`.

Restart the development server after changing configuration. Production deployments require a new build. The `.env` files select build modes; service addresses come from `vue.config.js`.

See [the configuration guide](docs/CONFIGURATION.md) and [the Chinese README](README.md) for details and existing screenshots.

## Validation and deployment

```bash
npm run check:config # Local configuration and URL checks; no backend requests
npm run test:unit    # Local unit tests
npm run build       # Production assets in dist/
```

Production assets use the configured backend directly. The development proxy is not part of the production deployment. Cross-origin deployments require backend CORS support for the frontend origin and existing authentication headers. External services and embedded pages keep their own addresses and authentication flows.

Device commands and finance actions operate on real services. Configuration verification does not require exercising these business actions.
