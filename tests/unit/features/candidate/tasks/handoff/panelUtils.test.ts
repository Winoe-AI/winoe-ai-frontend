import { setMockVideoDuration } from './HandoffUploadPanel.testlib';
import { validateVideoDuration } from '@/features/candidate/tasks/handoff/panelUtils';

describe('panelUtils validateVideoDuration', () => {
  it('rounds browser metadata to an integer before upload-init', async () => {
    jest.useRealTimers();
    setMockVideoDuration(14.303991);
    const file = new File(['video'], 'day4-demo.mp4', {
      type: 'video/mp4',
    });

    await expect(validateVideoDuration(file)).resolves.toBe(14);
  });
});
