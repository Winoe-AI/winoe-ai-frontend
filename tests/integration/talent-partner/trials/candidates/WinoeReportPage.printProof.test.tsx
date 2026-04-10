import fs from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import { AppHeader } from '@/shared/layout/AppHeader';
import { contentContainer } from '@/shared/layout/layoutStyles';
import {
  WinoeReportPage,
  READY_PAYLOAD,
  jsonResponse,
  resetWinoeReportTest,
  setFetchForWinoeReport,
  textResponse,
} from './WinoeReportPage.testlib';

describe('WinoeReportPage print-proof artifact', () => {
  beforeEach(() => resetWinoeReportTest());
  afterEach(() => {
    jest.useRealTimers();
    document.body.classList.remove('winoe-report-print-mode');
  });

  it('writes a print-proof HTML artifact with talent_partner shell + winoe report tree', async () => {
    setFetchForWinoeReport(async (url) =>
      url === '/api/candidate_sessions/2/winoe_report'
        ? jsonResponse({
            ...READY_PAYLOAD,
            report: {
              ...READY_PAYLOAD.report,
              dayScores: [
                {
                  dayIndex: 1,
                  score: 0.7,
                  rubricBreakdown: { communication: 0.8 },
                  evidence: [
                    {
                      kind: 'commit',
                      ref: 'abc123',
                      url: 'https://github.com/org/repo/commit/abc123?token=private-token',
                      excerpt: 'Introduced clean module boundaries.',
                    },
                  ],
                },
              ],
            },
          })
        : textResponse('Not found', 404),
    );

    const { container } = render(
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <a href="#main-content" data-winoe-report-no-print="true">
          Skip to main content
        </a>
        <AppHeader
          isAuthed
          permissions={['talent_partner:access']}
          navScope="talent_partner"
        />
        <main
          id="main-content"
          data-winoe-report-main-content="true"
          className={`${contentContainer} py-6`}
        >
          <WinoeReportPage />
        </main>
      </div>,
    );

    expect(await screen.findByText('78%')).toBeInTheDocument();
    expect(screen.getByText(/URL:/)).toHaveTextContent(
      'https://github.com/org/repo/commit/abc123',
    );
    expect(screen.getByText(/URL:/)).not.toHaveTextContent('token=');

    const cssPath = path.join(process.cwd(), 'src/app/globals.css');
    const fullCss = fs
      .readFileSync(cssPath, 'utf8')
      .replace(/@import\s+['"][^'"]+['"];\s*/g, '');
    const artifactPath = path.join(
      process.cwd(),
      'test-results',
      'winoe-report-print-proof.html',
    );
    const html = `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <title>Winoe Report Print Proof</title>\n  <style>${fullCss}</style>\n</head>\n<body class="winoe-report-print-mode">${container.innerHTML}</body>\n</html>`;
    fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
    fs.writeFileSync(artifactPath, html, 'utf8');
    expect(fs.existsSync(artifactPath)).toBe(true);
  });
});
