import { render, screen, within } from '@testing-library/react';
import { SubmissionReviewCodePreview } from '@/features/talent-partner/submission-review/components/SubmissionReviewCodePreview';

describe('SubmissionReviewCodePreview', () => {
  it('renders highlighted code with metadata and line numbers', () => {
    render(
      <SubmissionReviewCodePreview
        file={{
          name: 'app.ts',
          path: 'src/app.ts',
          type: 'file',
          language: 'ts',
          changed: true,
          content:
            'const answer = 42;\nfunction greet() {\n  return answer;\n}\n',
        }}
      />,
    );

    expect(
      screen.getByTestId('submission-review-code-preview'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('submission-review-code-syntax'),
    ).toBeInTheDocument();
    expect(screen.getByText('app.ts')).toBeInTheDocument();
    expect(screen.getByText(/src\/app\.ts · ts/i)).toBeInTheDocument();
    expect(screen.getByText('Changed')).toBeInTheDocument();
    expect(screen.getByText('file')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('submission-review-code-preview')).getAllByText(
        /^1$/,
      ).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('const')).toBeInTheDocument();
    expect(screen.getByText('function')).toBeInTheDocument();
  });

  it('shows the truncation banner for oversized files', () => {
    const content = Array.from(
      { length: 401 },
      (_, index) => `line ${index + 1}`,
    ).join('\n');

    render(
      <SubmissionReviewCodePreview
        file={{
          name: 'big.ts',
          path: 'src/big.ts',
          type: 'file',
          language: 'ts',
          changed: false,
          content,
        }}
      />,
    );

    expect(
      screen.getByText(/Large file truncated after 400 lines/i),
    ).toBeInTheDocument();
  });
});
