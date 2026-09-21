import { Injectable } from '@nestjs/common';
import { WelcomePageData } from './welcome.types';

@Injectable()
export class WelcomeService {
  getPage(): WelcomePageData {
    return {
      tagline: 'Now Nest can react',
      nodes: [
        {
          id: 'app',
          kind: 'module',
          label: 'AppModule',
          x: 50,
          y: 10,
          detail:
            'AppModule imports WelcomeModule and NestReactModule.forRoot(). Nest still owns the application graph.',
        },
        {
          id: 'welcome',
          kind: 'module',
          label: 'WelcomeModule',
          x: 50,
          y: 28,
          detail:
            'The welcome feature is a Nest module: controller, service, page, and a client island in one folder.',
        },
        {
          id: 'controller',
          kind: 'controller',
          label: 'Controller',
          x: 24,
          y: 50,
          detail:
            'GET /welcome lands on WelcomeController. It loads data and calls renderPage — React does not fetch this route.',
        },
        {
          id: 'service',
          kind: 'service',
          label: 'Service',
          x: 76,
          y: 50,
          detail:
            'WelcomeService supplies the tagline and module graph through Nest DI.',
        },
        {
          id: 'page',
          kind: 'page',
          label: 'WelcomePage',
          x: 50,
          y: 72,
          detail:
            'The page is a server view. It composes HTML, sets layout meta, and registers the graph island.',
        },
        {
          id: 'islands',
          kind: 'island',
          label: 'Islands',
          x: 50,
          y: 90,
          detail:
            'The module graph is a hydrated island with its own CSS. The rest of the page is server HTML.',
        },
      ],
      edges: [
        { from: 'app', to: 'welcome' },
        { from: 'welcome', to: 'controller' },
        { from: 'welcome', to: 'service' },
        { from: 'controller', to: 'page' },
        { from: 'service', to: 'page' },
        { from: 'page', to: 'islands' },
      ],
    };
  }
}
