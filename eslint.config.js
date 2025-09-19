// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    rules: {
      'import/first': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
    settings: {
      'import/resolver': {
        typescript: {},
      },
    },
    ignores: ['dist/*'],
  },
]);
