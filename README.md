# nest-can-react

NestJS-native React rendering. Nest owns the application; React renders pages and islands.

Install it into an **existing NestJS app**, then scaffold the welcome starter:

```bash
cd my-nest-app
npm install nest-can-react
npx nest-can-react init
npm install
npm run view:dev
```

That adds `src/welcome`, `src/layout.tsx`, and `nest.react.json`, wires `NestReactModule` into `AppModule`, and serves **GET /welcome**.

## App imports

```ts
import { NestReactModule, renderPage, Island } from 'nest-can-react';
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

Islands import client helpers from `nest-can-react/client`:

```ts
import { useCommit } from 'nest-can-react/client';
```

## CLI

| Command | What it does |
| --- | --- |
| `nest-can-react init [dir]` | Add the welcome starter to an existing Nest app |
| `nest-can-react dev` | Client bundler + Nest watch |
| `nest-can-react build` | Production client assets |

## Docs

- [Creating your first app](docs/first-app.md)
- [Core concepts](docs/core-concepts.md)
