import { defineNestReactConfig } from './src/core/build/config.mjs';

export default defineNestReactConfig({
  clientEntry: 'src/demo/client/entry.tsx',
  outDir: 'public/nest-react',
  publicPath: '/assets/nest-react',
  codeSplitting: process.env.NEST_REACT_CODE_SPLITTING !== 'false',
  islands: ['DashboardControls', 'GreetingEditor', 'UserCreator'],
});
