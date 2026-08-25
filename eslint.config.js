import js from '@eslint/js'
import json from '@eslint/json'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import storybook from 'eslint-plugin-storybook'

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/storybook-static/**',
      '**/coverage/**',
      '**/node_modules/**',
      'apps/erp-web/public/mockServiceWorker.js',
    ],
  },
  {
    // JS 룰은 반드시 JS/TS 로 한정한다 — files 없이 두면 JSON 파일에도 적용돼
    // no-irregular-whitespace 같은 룰이 JSON AST 를 만나 크래시한다
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },
  {
    /**
     * 컴포넌트 라이브러리 성격의 파일들.
     * - styled.div 익스포트는 실제로 컴포넌트지만 룰이 인식하지 못한다
     * - useToast / useThemeMode 처럼 훅을 프로바이더 옆에 두는 건 의도된 API 설계다
     * 피처·페이지 코드에는 룰을 그대로 남겨 실제 실수를 잡는다.
     */
    files: ['packages/design-system/**/*.{ts,tsx}', 'apps/erp-web/src/shared/ui/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // 순수 JSON (package.json 등). 중복 키·빈 키 같은 실수를 잡는다.
    files: ['**/*.json'],
    ignores: ['**/tsconfig*.json', '.vscode/*.json'],
    language: 'json/json',
    plugins: { json },
    rules: json.configs.recommended.rules,
  },
  {
    // tsconfig 와 .vscode 설정은 주석을 허용하므로 JSONC 로 파싱해야 한다
    files: ['**/tsconfig*.json', '.vscode/*.json'],
    language: 'json/jsonc',
    plugins: { json },
    rules: json.configs.recommended.rules,
  },
  ...storybook.configs['flat/recommended'],
)
