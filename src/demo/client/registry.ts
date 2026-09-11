import { IslandClientRegistry } from '../../core/client/mount';

export const registry = {
  DashboardControls: () =>
    import('./components/DashboardControls.js').then(
      (module) => module.DashboardControls,
    ),
  GreetingEditor: () =>
    import('./components/GreetingEditor.js').then(
      (module) => module.GreetingEditor,
    ),
  UserCreator: () =>
    import('./components/UserCreator.js').then((module) => module.UserCreator),
} satisfies IslandClientRegistry;
