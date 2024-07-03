// eslint.config.js
import config from 'eslint-config-mourner';
import globals from 'globals';

export default [
  ...config,
  // These rules are migrated from old config
  {
    languageOptions: {
      globals: {
        ...globals.document,
      },
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    rules: {
      'block-scoped-var': 2,
      'consistent-return': 0,
      'no-new': 0,
      'no-warning-comments': 2,
      'camelcase': 0,
      'no-console': ['error', {'allow': ['warn', 'error']}],

      '@stylistic/js/indent': [2, 2],
      // '@stylistic/js/indent': 0,
      '@stylistic/js/array-bracket-spacing': 0,
      '@stylistic/js/key-spacing': 0,
      '@stylistic/js/object-curly-spacing': 0,
      // '@stylistic/js/quotes': [2, 'single'],
      '@stylistic/js/quotes': 0,
      // '@stylistic/js/space-before-function-paren': [2, {anonymous: 'always', named: 'never'}],
      '@stylistic/js/space-before-function-paren': 0,
    }
  },
  // These rules are added to pass tests after migration, and should be removed later
  {
    rules: {
      'strict': 0,
      'no-else-return': 0,
      'no-promise-executor-return': 0,
      'no-await-in-loop': 0,
    }
  }
];
