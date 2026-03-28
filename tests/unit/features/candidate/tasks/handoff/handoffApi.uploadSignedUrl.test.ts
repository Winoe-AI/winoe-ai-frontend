import {
  importHandoffApi,
  MockXmlHttpRequest,
  restoreHandoffApiEnv,
} from './handoffApi.testlib';

describe('handoffApi upload to signed URL', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    restoreHandoffApiEnv();
  });

  it('uploads to signed URL with progress and content type', async () => {
    global.XMLHttpRequest =
      MockXmlHttpRequest as unknown as typeof XMLHttpRequest;
    const progressSpy = jest.fn();
    const { uploadFileToSignedUrl } = await importHandoffApi();
    const file = new File(['video'], 'demo.mp4', { type: 'video/mp4' });

    const uploadPromise = uploadFileToSignedUrl({
      uploadUrl: 'https://storage.example.com/signed',
      file,
      onProgress: progressSpy,
    });
    const xhr = MockXmlHttpRequest.latest as MockXmlHttpRequest;
    expect(xhr.method).toBe('PUT');
    expect(xhr.url).toBe('https://storage.example.com/signed');
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 5, total: 10 });
    xhr.status = 200;
    xhr.onload?.();

    await expect(uploadPromise).resolves.toBeUndefined();
    expect(progressSpy).toHaveBeenCalledWith(50);
    expect(progressSpy).toHaveBeenCalledWith(100);
    expect(xhr.headers['Content-Type']).toBe('video/mp4');
  });
});
