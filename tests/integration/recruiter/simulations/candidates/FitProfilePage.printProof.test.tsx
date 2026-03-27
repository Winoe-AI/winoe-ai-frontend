import fs from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import { AppHeader } from '@/shared/layout/AppHeader';
import { contentContainer } from '@/shared/layout/layoutStyles';
import {
  FitProfilePage,
  READY_PAYLOAD,
  jsonResponse,
  resetFitProfileTest,
  setFetchForFitProfile,
  textResponse,
} from './FitProfilePage.testlib';

describe('FitProfilePage print-proof artifact', () => {
  beforeEach(() => resetFitProfileTest());
  afterEach(() => {
    jest.useRealTimers();
    document.body.classList.remove('fit-profile-print-mode');
  });

  it('writes a print-proof HTML artifact with recruiter shell + fit profile tree', async () => {
    setFetchForFitProfile(async (url) => (url === '/api/candidate_sessions/2/fit_profile' ? jsonResponse({ ...READY_PAYLOAD, report: { ...READY_PAYLOAD.report, dayScores: [{ dayIndex: 1, score: 0.7, rubricBreakdown: { communication: 0.8 }, evidence: [{ kind: 'commit', ref: 'abc123', url: 'https://github.com/org/repo/commit/abc123?token=private-token', excerpt: 'Introduced clean module boundaries.' }] }] } }) : textResponse('Not found', 404)));

    const { container } = render(
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <a href="#main-content" data-fit-profile-no-print="true">Skip to main content</a>
        <AppHeader isAuthed permissions={['recruiter:access']} navScope="recruiter" />
        <main id="main-content" data-fit-profile-main-content="true" className={`${contentContainer} py-6`}>
          <FitProfilePage />
        </main>
      </div>,
    );

    expect(await screen.findByText('78%')).toBeInTheDocument();
    expect(screen.getByText(/URL:/)).toHaveTextContent('https://github.com/org/repo/commit/abc123');
    expect(screen.getByText(/URL:/)).not.toHaveTextContent('token=');

    const cssPath = path.join(process.cwd(), 'src/app/globals.css');
    const fullCss = fs.readFileSync(cssPath, 'utf8').replace(/@import\s+['"][^'"]+['"];\s*/g, '');
    const artifactPath = path.join(process.cwd(), 'test-results', 'fit-profile-print-proof.html');
    const html = `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <title>Fit Profile Print Proof</title>\n  <style>${fullCss}</style>\n</head>\n<body class="fit-profile-print-mode">${container.innerHTML}</body>\n</html>`;
    fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
    fs.writeFileSync(artifactPath, html, 'utf8');
    expect(fs.existsSync(artifactPath)).toBe(true);
  });
});
