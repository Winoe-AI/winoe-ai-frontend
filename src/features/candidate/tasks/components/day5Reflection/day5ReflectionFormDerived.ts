import {
  hasDay5SectionContent,
  type Day5FieldErrors,
  type Day5ReflectionSections,
} from '../../utils/day5ReflectionUtils';

export function deriveReadOnlyReason(params: {
  actionGateReadOnly: boolean;
  actionGateReason: string | null;
  submittedTerminal: boolean;
}) {
  if (params.actionGateReadOnly) {
    return (
      params.actionGateReason ??
      'Day closed. Reflection is read-only outside the scheduled window.'
    );
  }
  if (params.submittedTerminal)
    return 'Submitted. Reflection is now read-only.';
  return null;
}

export function deriveDisplayStatus(params: {
  submitting: boolean;
  submittedTerminal: boolean;
  submitStatus: 'idle' | 'submitting' | 'submitted';
}) {
  if (params.submitting) return 'submitting' as const;
  if (params.submittedTerminal) return 'submitted' as const;
  return params.submitStatus;
}

export function deriveReadOnlyContent(params: {
  actionGateReadOnly: boolean;
  hasRecordedSubmission: boolean;
  hasStructuredRecordedContent: boolean;
  recordedContentText: string;
  recordedSections: Day5ReflectionSections;
  sections: Day5ReflectionSections;
}) {
  const replayReadOnly =
    params.actionGateReadOnly || params.hasRecordedSubmission;
  const readOnlySections =
    replayReadOnly &&
    !params.recordedContentText.trim() &&
    params.hasStructuredRecordedContent
      ? params.recordedSections
      : !replayReadOnly && hasDay5SectionContent(params.sections)
        ? params.sections
        : null;
  const readOnlyFallbackMarkdown = replayReadOnly
    ? params.recordedContentText
    : '';
  return { replayReadOnly, readOnlySections, readOnlyFallbackMarkdown };
}

export function deriveDay5ErrorToShow(params: {
  localFormError: string | null;
  backendFieldErrors: Day5FieldErrors;
  submitError?: string | null;
}) {
  return (
    params.localFormError ??
    (Object.keys(params.backendFieldErrors).length > 0
      ? null
      : (params.submitError ?? null))
  );
}
