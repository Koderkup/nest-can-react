# nest-react

NestJS-native React rendering. Nest owns the application; React renders pages and islands.

This is **v0.1.0** — the first published release.

```bash
npx nest-react init my-app
cd my-app
npm install
npm run view:dev
```

That scaffolds the welcome starter and opens `/welcome`.

## App imports

```ts
import { NestReactModule, renderPage, Island } from 'nest-react';
```

```ts
@Module({
  imports: [NestReactModule.forRoot(), WelcomeModule],
})
export class AppModule {}
```

```ts
@Get()
@Header('content-type', 'text/html')
index() {
  return renderPage(WelcomePage, this.welcome.getPage(), { mode: 'hydrated' });
}
```

```tsx
<Island mode="hydrate" name={ArchitectureMap} props={{ nodes, edges }} />
```

Islands import client helpers from `nest-react/client`:

```ts
import { useCommit } from 'nest-react/client';
```

## CLI

| Command | What it does |
| --- | --- |
| `nest-react init [dir]` | Copy the welcome starter |
| `nest-react dev` | Client bundler + Nest watch |
| `nest-react build` | Production client assets |

## Docs

- [Creating your first app](docs/first-app.md)
- [Core concepts](docs/core-concepts.md)

## Repository layout

```txt
src/                 # nest-react runtime
bin/                 # CLI
templates/starter/   # copied by init
docs/
```

Generated output in an app (not this package): `.nest-react/generated/` and `public/nest-react/`.
