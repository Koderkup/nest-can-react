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
            'The welcome feature is a Nest module: controller, service, Server Component page, and a client island.',
        },
        {
          id: 'controller',
          kind: 'controller',
          label: 'Controller',
          x: 24,
          y: 50,
          detail:
            'GET /welcome lands on WelcomeController. It loads data and streams renderPage over Flight.',
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
            'WelcomePage is a Server Component (use server-entry). It streams HTML and embeds client references.',
        },
        {
          id: 'client',
          kind: 'client',
          label: 'use client',
          x: 50,
          y: 90,
          detail:
            'ArchitectureMap is a client component island. It hydrates in one React tree shared across the page.',
        },
      ],
      edges: [
        { from: 'app', to: 'welcome' },
        { from: 'welcome', to: 'controller' },
        { from: 'welcome', to: 'service' },
        { from: 'controller', to: 'page' },
        { from: 'service', to: 'page' },
        { from: 'page', to: 'client' },
      ],
    };
  }
}
