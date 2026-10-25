const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const path = require('path');

// Resolve plugins from eslint-config-expo's own folder. The repo root also has an old
// eslint-plugin-react-hooks canary (pulled in by another workspace) that crashes on ESLint 9.
const compat = new FlatCompat({
// eslint-disable-next-line no-undef
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: path.dirname(require.resolve('eslint-config-expo/package.json')),
});

module.exports = [
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*', 'android/*', 'ios/*'],
  },
  js.configs.recommended,
  ...compat.extends('expo'),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-console': 'warn',
      // React Compiler is off in app.json (experiments.reactCompiler: false), so these
      // compiler-readiness checks are advisory here, not runtime errors.
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
];
