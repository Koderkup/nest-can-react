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

Open **GET /welcome**. Controllers return `render(WelcomePage)`. The page calls `inject()` on the same Nest container.

Full demo apps in this repo:

- [`examples/express`](examples/express) — default (`@nestjs/platform-express`)
- [`examples/fastify`](examples/fastify) — optional Fastify adapter

Repository: [github.com/acefolioDev/nest-can-react](https://github.com/acefolioDev/nest-can-react)

## App imports

```ts
import { NestReactModule, render, inject } from 'nest-can-react';
```

```ts
@Module({
  imports: [NestReactModule.forRoot(), WelcomeModule],
})
export class AppModule {}
```

```ts
import { WelcomePage } from './react-pages';

@Get()
index() {
  return render(WelcomePage);
}
```

```tsx
'use server-entry';

import { inject } from 'nest-can-react';
import { WelcomeService } from './welcome.service';

export default function WelcomePage() {
  const data = inject(WelcomeService).getPage();
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
| `nest-can-react dev` | Push-only HMR: Fast Refresh for client/CSS, Flight refetch for RSC, guarded full reload when an update cannot be applied |
| `nest-can-react build` | Production RSC/SSR/client assets |

## Docs

- [Creating your first app](docs/first-app.md)
- [Core concepts](docs/core-concepts.md)
- [Package APIs](docs/api.md)
