// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Tell Metro to only look in mobile/node_modules — not walk up to the
// parent rondo-app/node_modules which has Next.js/web packages that crash
// the React Native bundler.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
