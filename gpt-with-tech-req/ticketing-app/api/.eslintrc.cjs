module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'next/core-web-vitals'
  ],
  rules: {
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'no-unused-vars': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn'],
    'no-console': 'off',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all']
  },
  env: {
    node: true,
    es2022: true
  },
  overrides: [
    {
      files: ['**/*.js', '**/*.cjs'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ]
};
