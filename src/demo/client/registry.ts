import { ComponentType } from 'react';
import { DashboardControls } from './components/DashboardControls';
import { GreetingEditor } from './components/GreetingEditor';
import { UserCreator } from './components/UserCreator';

export const registry: Record<string, ComponentType<any>> = {
  DashboardControls,
  GreetingEditor,
  UserCreator,
};
