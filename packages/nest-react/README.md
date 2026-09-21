# nest-react

NestJS-native React rendering. Nest owns the application; React renders pages and islands.

```bash
npx nest-react init my-app
cd my-app
npm install
npm run view:dev
```

App code imports:

```ts
import { NestReactModule, renderPage, Island } from 'nest-react';
```

CLI:

- `nest-react init [dir]` — copy the welcome starter
- `nest-react dev` — island bundler + Nest watch
- `nest-react build` — production client assets
