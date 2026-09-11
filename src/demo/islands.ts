import { registerClientRuntime, registerIslandComponents } from '../core';
import { registry } from '../../.nest-react/generated/server-registry.js';
import { ClientRuntime } from './app.runtime';

registerIslandComponents(registry);
registerClientRuntime(ClientRuntime);
