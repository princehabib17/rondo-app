// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// The mobile app lives inside rondo-app/ which has its own node_modules
// (Next.js, React DOM, etc). Metro walks up the tree and finds those web-only
// packages, then tries to bundle them — hanging or crashing because they use
// Node.js built-ins that React Native doesn't have.
// Block the parent node_modules so Metro only uses mobile/node_modules.
const parentNodeModules = path.join(workspaceRoot, 'node_modules');
const escapedPath = parentNodeModules.replace(/[/\\]/g, '[/\\\\]');
config.resolver.blockList = [
  new RegExp(`^${escapedPath}($|[/\\\\])`),
];

// Only look for modules in mobile/node_modules, not the parent
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

module.exports = config;
