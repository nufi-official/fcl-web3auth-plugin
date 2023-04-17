module.exports = {
  extends: [
    'vacuumlabs',
    'prettier',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
  ],
  env: {
    browser: true,
    node: true,
  },
  rules: {
    'no-console': 'error',
    '@typescript-eslint/no-explicit-any': [
      'error',
      {
        ignoreRestArgs: true,
      },
    ],
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-use-before-define.md#how-to-use
    // note you must disable the base rule as it can report incorrect errors
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error'],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error'],
    // Why detect cycles: https://spin.atomicobject.com/2018/06/25/circular-dependencies-javascript
    // TLDR - memory crashes, tangled architecture, unreadable code, undefined imports
    'import/no-cycle': ['error'],
    'import/no-extraneous-dependencies': ['error'],
    'spaced-comment': ['error', 'always', {block: {balanced: true}}],
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    createDefaultProgram: true,
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts'],
      },
    },
  },
  ignorePatterns: ['dist', 'node_modules'],
}
