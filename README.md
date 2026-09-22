# nest-can-react

Nest-native **React Server Components** over the **Flight** protocol.

Nest owns the application (modules, DI, guards, routing, APIs). React streams Server Component trees; `'use client'` marks interactive islands.

```bash
cd my-nest-app
npm install nest-can-react react react-dom react-server-dom-rspack
npx nest-can-react init
npm install
npm run view:dev
```

Open **GET /welcome**. Controllers call `renderPage` and stream HTML + Flight.

## App imports

```ts
import { NestReactModule, renderPage } from 'nest-can-react';
```

```ts
@Module({
  imports: [NestReactModule.forRoot(), WelcomeModule],
})
export class AppModule {}
```

```ts
@Get()
async index(@Req() request: Request, @Res() response: Response) {
  await renderPage('welcome', this.welcome.getPage(), { request, response });
}
```

```tsx
'use server-entry';

export default function WelcomePage(data) {
  return (
    <>
      <h1>{data.tagline}</h1>
      <Counter />
    </>
  );
}
```

```tsx
'use client';

export function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}
```

Client helpers:

```ts
import { useCommit, refresh, navigateTo } from 'nest-can-react/client';
```

## CLI

| Command | What it does |
| --- | --- |
| `nest-can-react init [dir]` | Add the welcome starter to an existing Nest app |
| `nest-can-react dev` | RSC watch + client dev-server (Fast Refresh) + Nest watch + RSC refresh websocket |
| `nest-can-react build` | Production RSC/SSR/client assets |

## Docs

- [Creating your first app](docs/first-app.md)
- [Core concepts](docs/core-concepts.md)
