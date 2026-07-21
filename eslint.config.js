import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import eslintConfigPrettier from 'eslint-config-prettier'

// Defensive: react-hooks exposes its recommended rules under different keys
// across versions ('recommended' vs flat 'recommended-latest').
const reactHooksRecommended =
  (reactHooks.configs &&
    (reactHooks.configs['recommended-latest'] || reactHooks.configs.recommended)) ||
  {}
const reactHooksRules = reactHooksRecommended.rules || {}

export default tseslint.config(
  { ignores: ['dist', 'build', 'coverage', 'server', 'api', 'supabase', '*.config.*'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      ...reactHooksRules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // TypeScript handles these; the JS versions misfire on types/TS-only syntax.
      'no-undef': 'off',
      'no-unused-vars': 'off',
      // Warnings (not errors) so existing code lints without blocking; tighten later.
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
    },
  },
  eslintConfigPrettier, // MUST be last: turns off style rules that Prettier owns.
)
