module.exports = {
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:jest/recommended',
    'prettier'
  ],
  plugins: ['jest', 'node'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'off', // CLI tool needs console
    'node/no-unpublished-require': 'off',
    'node/shebang': ['error', { convertPath: { 'bin/**/*.js': ['^bin/', ''] } }],
    'jest/expect-expect': 'warn',
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error'
  },
  overrides: [
    {
      files: ['__tests__/**/*.js', '*.test.js'],
      rules: {
        'node/no-unpublished-require': 'off'
      }
    }
  ]
};
