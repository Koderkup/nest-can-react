# Contributing to nest-can-react

Thanks for helping improve `nest-can-react`! Contributions of all sizes are welcome, including bug reports, documentation improvements, examples, tests, and code changes.

## Before you start

- Check the [documentation](docs/README.md) and existing [issues](https://github.com/acefolioDev/nest-can-react/issues) before opening a new issue.
- For security vulnerabilities, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.
- For larger changes, open an issue first so the approach can be discussed before implementation begins.

## Development setup

Requirements:

- Node.js compatible with the versions supported by the project dependencies
- npm

From the repository root:

```bash
npm install
npm run build
```

The build runs the strict TypeScript check and is the project’s validation gate.

To try the example applications, install and run an example in one terminal and the RSC view bundler in another:

```bash
cd examples/express
npm install
npm run view:dev
```

In a second terminal:

```bash
cd examples/express
npm run start:dev
```

The Fastify example uses the same commands from `examples/fastify`.

## Making changes

1. Create a focused branch from the default branch.
2. Make the smallest change that solves the problem.
3. Update documentation or examples when behavior or public APIs change.
4. Run `npm run build` before opening a pull request.
5. Include manual verification steps and example-app coverage when relevant.

Generated React page references such as `src/react-pages.ts` in an example are produced by the bundler. Do not edit generated files by hand; change the source page and regenerate them instead.

Please preserve the existing architecture and conventions. In particular, adapter-specific HTTP normalization belongs in `src/nest/response-utils.ts`, redirect status codes are defined in `src/data/context.ts`, and redirect handling is implemented in `src/flight/handle-request.ts`.

## Commit and pull request guidance

There is no mandatory commit-message format. Keep commits clear and focused. A pull request should:

- Explain the problem and the proposed solution.
- Describe any user-visible or API changes.
- Include tests or reproducible verification steps.
- Update relevant documentation.
- Avoid unrelated formatting or refactoring.

Maintainers may ask for changes to improve scope, compatibility, test coverage, or documentation before merging.

## Reporting bugs and requesting features

Use the GitHub issue forms:

- [Report a bug](https://github.com/acefolioDev/nest-can-react/issues/new?template=bug_report.yml)
- [Request a feature](https://github.com/acefolioDev/nest-can-react/issues/new?template=feature_request.yml)

Please include the package version, Node.js version, adapter, reproduction steps, and the smallest useful code sample. Remove secrets and other sensitive data from logs before posting them.

## License

By contributing, you agree that your contributions will be licensed under the repository’s [MIT License](LICENSE).
