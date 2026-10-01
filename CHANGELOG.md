# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.3.1] - 2026-10-01

### Added

- **Fastify adapter** — `NestReactModule.forRoot({ adapter: 'fastify' })` with optional peers `@nestjs/platform-fastify` and `@fastify/static`; HTTP normalization via `normalizeHttpResponse` for the render pipeline on Express and Fastify.
- **`redirect(url, statusCode?)`** — render-time HTTP redirects (301, 302, 303, 307, 308) with Flight stream abort and a clean 3xx response.
- **Cookie helpers** — `setCookie`, `clearCookie`, `getCookie`, plus related types and low-level serialization helpers exported from the main entry.

### Changed

- **Page ids** are derived from each `*.page.tsx` file path (e.g. `src/welcome/welcome.page.tsx` → `'welcome/welcome'`). Regenerate `src/react-pages.ts` with `nest-can-react dev` or `build` after upgrading if you relied on older flat ids.
- **npm package metadata** — added `keywords` for npm search discoverability.

### Fixed

- Page discovery: `**` in `pages.include` globs can match zero path segments.

### Documentation

- Restructured docs hub and expanded [Package APIs](docs/api.md), [HTTP during render](docs/concepts/http-during-render.md), and [Render and page refs](docs/concepts/render-and-page-refs.md).
- README contributing section.

## [0.3.0] - 2026-09-23

### Added

- Layout integration with shared document chrome and starter welcome flow.
- Controller `render()` + page `inject()` integration for Nest DI inside Server Components.

### Changed

- Initial public release under the `nest-can-react` package name at 0.3.0.
