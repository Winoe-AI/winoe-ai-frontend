import { requestWithMeta } from '@/platform/api-client/client/request';
import {
  candidateClientOptions,
  toStringOrNull,
} from '@/features/candidate/session/api/baseApi';
import { normalizeStatus } from '@/features/candidate/session/api/taskErrorMessagesApi';
import {
  isEndpointUnavailableStatus,
  mapHandoffApiError,
} from './handoffApi.errors';
import { candidateJsonHeaders } from './handoffApi.requestHeaders';
import type { HandoffConsentPayload } from './handoffApi.types';

const DEFAULT_NOTICE_VERSION = 'mvp1';

export async function persistPrivacyConsent(params: {
  candidateSessionId: number;
  consent?: HandoffConsentPayload | null;
}) {
  const noticeVersion = toStringOrNull(params.consent?.aiNoticeVersion) ?? null;
  const consentRequired = params.consent?.consented === true;
  if (!consentRequired)
    return { consentRequired, consentSaved: false, noticeVersion };

  const resolvedNoticeVersion = noticeVersion ?? DEFAULT_NOTICE_VERSION;
  try {
    await requestWithMeta<unknown>(
      `/candidate/session/${String(params.candidateSessionId)}/privacy/consent`,
      {
        method: 'POST',
        cache: 'no-store',
        body: {
          noticeVersion: resolvedNoticeVersion,
          aiNoticeVersion: noticeVersion ?? undefined,
        },
        headers: candidateJsonHeaders(params.candidateSessionId),
      },
      candidateClientOptions,
    );
    return { consentRequired, consentSaved: true, noticeVersion };
  } catch (err) {
    const status = normalizeStatus(err, Number.NaN);
    if (!isEndpointUnavailableStatus(status))
      mapHandoffApiError(err, 'consent');
    return { consentRequired, consentSaved: false, noticeVersion };
  }
}

export function buildCompleteBody(params: {
  recordingId: string;
  consentRequired: boolean;
  consentSaved: boolean;
  noticeVersion: string | null;
}) {
  const body: Record<string, unknown> = { recordingId: params.recordingId };
  if (params.consentRequired && !params.consentSaved) {
    body.consentAccepted = true;
    if (params.noticeVersion) {
      body.aiNoticeVersion = params.noticeVersion;
      body.noticeVersion = params.noticeVersion;
    }
  }
  return body;
}
