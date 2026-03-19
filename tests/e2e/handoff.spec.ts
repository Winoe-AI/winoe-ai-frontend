import { expect, test } from '@playwright/test';

test('candidate Day 4 handoff upload flow hydrates and reaches transcript ready', async ({
  page,
}) => {
  let completeBody: Record<string, unknown> | null = null;
  let initBody: Record<string, unknown> | null = null;
  let statusAfterCompleteCalls = 0;
  let completed = false;
  let deleted = false;

  await page.route('**/api/backend/**', async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());

    if (pathname.endsWith('/candidate/session/test-token')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidateSessionId: 77,
          status: 'in_progress',
          simulation: {
            title: 'Frontend Platform Modernization',
            role: 'Senior Frontend Engineer',
          },
        }),
      });
      return;
    }

    if (pathname.endsWith('/candidate/session/77/current_task')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isComplete: false,
          completedTaskIds: [1, 2, 3],
          currentTask: {
            id: 4,
            dayIndex: 4,
            type: 'handoff',
            title: 'Handoff demo',
            description: 'Upload your walkthrough video.',
          },
        }),
      });
      return;
    }

    if (pathname.endsWith('/tasks/4/handoff/upload/init')) {
      initBody = request.postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          recordingId: 'rec_123',
          uploadUrl: 'https://storage.example.com/signed',
          expiresInSeconds: 900,
        }),
      });
      return;
    }

    if (pathname.endsWith('/tasks/4/handoff/upload/complete')) {
      completeBody = request.postDataJSON() as Record<string, unknown>;
      completed = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          recordingId: 'rec_123',
          status: 'uploaded',
        }),
      });
      return;
    }

    if (pathname.endsWith('/tasks/4/handoff/status')) {
      let body: Record<string, unknown>;
      if (deleted) {
        body = {
          recording: null,
          transcript: null,
          isDeleted: true,
          deletedAt: '2026-03-16T10:10:00.000Z',
          recordingStatus: 'deleted',
          transcriptStatus: 'deleted',
        };
      } else if (!completed) {
        body = {
          recording: null,
          transcript: null,
        };
      } else {
        statusAfterCompleteCalls += 1;
        body =
          statusAfterCompleteCalls === 1
            ? {
                recording: {
                  recordingId: 'rec_123',
                  status: 'uploaded',
                  downloadUrl: 'https://cdn.example.com/rec_123.mp4',
                },
                transcript: {
                  status: 'processing',
                  progress: 40,
                  text: null,
                  segments: null,
                },
              }
            : {
                recording: {
                  recordingId: 'rec_123',
                  status: 'ready',
                  downloadUrl: 'https://cdn.example.com/rec_123.mp4',
                },
                transcript: {
                  status: 'ready',
                  progress: null,
                  text: 'Final transcript from backend.',
                  segments: [
                    {
                      id: null,
                      startMs: 0,
                      endMs: 1250,
                      text: 'hello',
                    },
                  ],
                },
              };
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
      return;
    }

    if (
      pathname.endsWith('/tasks/4/handoff') &&
      request.method().toUpperCase() === 'DELETE'
    ) {
      deleted = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          deleted: true,
          deletedAt: '2026-03-16T10:10:00.000Z',
          status: 'deleted',
        }),
      });
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: `Unhandled route ${pathname}` }),
    });
  });

  await page.route('https://storage.example.com/**', async (route) => {
    await route.fulfill({ status: 200, body: '' });
  });
  await page.route('https://cdn.example.com/**', async (route) => {
    await route.fulfill({ status: 200, body: '' });
  });

  await page.goto('/candidate-sessions/test-token');

  const startButton = page.getByRole('button', { name: /start simulation/i });
  if ((await startButton.count()) > 0) {
    await startButton.first().click();
  }
  await expect(page.getByText(/handoff demo/i)).toBeVisible();
  await expect(
    page.getByRole('button', { name: /upload video/i }),
  ).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles({
    name: 'handoff.mp4',
    mimeType: 'video/mp4',
    buffer: Buffer.from('video-bytes'),
  });

  await expect(
    page.getByRole('button', { name: /complete upload/i }),
  ).toBeDisabled();
  await page
    .getByLabel(
      /I understand and consent to submission and processing of my video and transcript for evaluation/i,
    )
    .check();
  await page.getByRole('button', { name: /complete upload/i }).click();

  await expect(
    page.getByRole('button', { name: /replace upload/i }),
  ).toBeVisible();
  await expect(page.getByText(/transcript processing\.\.\./i)).toBeVisible();

  await page.waitForTimeout(4500);
  await expect(
    page.getByText(/final transcript from backend\./i),
  ).toBeVisible();
  await expect(page.getByText(/00:00 - 00:01/i)).toBeVisible();
  await expect(page.getByText(/hello/i)).toBeVisible();

  await page
    .getByRole('button', { name: /^delete upload$/i })
    .first()
    .click();
  await expect(page.getByText(/Delete this upload\?/i)).toBeVisible();
  await page
    .getByRole('button', { name: /^delete upload$/i })
    .nth(1)
    .click();
  await expect(page.getByText(/Upload deleted\./i)).toBeVisible();
  await expect(
    page.getByRole('button', { name: /upload video/i }),
  ).toBeVisible();

  expect(initBody).toEqual({
    contentType: 'video/mp4',
    sizeBytes: 11,
    filename: 'handoff.mp4',
  });
  expect(completeBody).toEqual({
    recordingId: 'rec_123',
    consentAccepted: true,
    aiNoticeVersion: 'mvp1',
    noticeVersion: 'mvp1',
  });
});
