import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import noComments from 'eslint-plugin-no-comments';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    plugins: {
      'no-comments': noComments,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-console': 'error',
      'no-comments/disallowComments': 'error',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.stories.tsx',
      'src/shared/ui/classnames.ts',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/(?:[a-z-]+:)?(?:bg|text|border|ring|outline)-(?:blue|indigo|purple)(?:-[0-9]+(?:.[0-9]+)?)?/]',
          message:
            'Do not use default Tailwind blue/indigo/purple palette. Use Winoe AI design tokens.',
        },
        {
          selector:
            'TemplateElement[value.raw=/(?:[a-z-]+:)?(?:bg|text|border|ring|outline)-(?:blue|indigo|purple)(?:-[0-9]+(?:.[0-9]+)?)?/]',
          message:
            'Do not use default Tailwind blue/indigo/purple palette. Use Winoe AI design tokens.',
        },
        {
          selector:
            'Literal[value=/bg-wheat-500[^"\'`]*text-wheat-[0-9]+|text-wheat-[0-9]+[^"\'`]*bg-wheat-500/]',
          message:
            'Do not use bg-wheat-500 and text-wheat-* together (low contrast).',
        },
        {
          selector:
            'TemplateElement[value.raw=/bg-wheat-500[^"\'`]*text-wheat-[0-9]+|text-wheat-[0-9]+[^"\'`]*bg-wheat-500/]',
          message:
            'Do not use bg-wheat-500 and text-wheat-* together (low contrast).',
        },
        {
          selector:
            'Literal[value=/bg-wheat-500[^"\'`]*text-wheat-500|text-wheat-500[^"\'`]*bg-wheat-500/]',
          message:
            'Do not use bg-wheat-500 and text-wheat-500 together (invisible text).',
        },
        {
          selector:
            'TemplateElement[value.raw=/bg-wheat-500[^"\'`]*text-wheat-500|text-wheat-500[^"\'`]*bg-wheat-500/]',
          message:
            'Do not use bg-wheat-500 and text-wheat-500 together (invisible text).',
        },
        {
          selector:
            'Literal[value=/bg-wheat-500[^"\'`]*text-white|text-white[^"\'`]*bg-wheat-500/]',
          message:
            'Do not use bg-wheat-500 and text-white together (low contrast). Use text-on-accent.',
        },
        {
          selector:
            'TemplateElement[value.raw=/bg-wheat-500[^"\'`]*text-white|text-white[^"\'`]*bg-wheat-500/]',
          message:
            'Do not use bg-wheat-500 and text-white together (low contrast). Use text-on-accent.',
        },
        {
          selector:
            'Literal[value=/#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/]',
          message:
            'Do not use raw hex colors in production code. Use Winoe AI design tokens.',
        },
        {
          selector:
            'TemplateElement[value.raw=/#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})\\b/]',
          message:
            'Do not use raw hex colors in production code. Use Winoe AI design tokens.',
        },
        {
          selector:
            'JSXText[value=/\\uD83C[\\uDC00-\\uDFFF]|\\uD83D[\\uDC00-\\uDFFF]|\\uD83E[\\uDD10-\\uDDFF]/]',
          message: 'Do not use emojis in production JSX.',
        },
      ],
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'coverage/**',
    '.qa/**',
    'qa_verifications/**',
    'code-quality/testing-coverage/passes/**',
    'storybook-static/**',
    'ladle-static/**',
  ]),
]);

export default eslintConfig;
