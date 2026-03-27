import type { ComponentType } from 'react';
import type { MarkdownPreviewProps } from '@/shared/ui/Markdown';
import {
  DAY5_REFLECTION_SECTIONS,
  day5SectionLabel,
  type Day5ReflectionSections,
} from '../../utils/day5Reflection';

type Props = {
  readOnlyReason: string | null;
  readOnlySections: Day5ReflectionSections | null;
  readOnlyFallbackMarkdown: string;
  PreviewComponent: ComponentType<MarkdownPreviewProps>;
};

export function Day5ReflectionReadOnlyView({
  readOnlyReason,
  readOnlySections,
  readOnlyFallbackMarkdown,
  PreviewComponent,
}: Props) {
  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-md border border-gray-300 bg-gray-100 p-3 text-sm text-gray-900">
        {readOnlyReason}
      </div>
      {readOnlySections ? (
        DAY5_REFLECTION_SECTIONS.map((section) => (
          <section key={section} className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">
              {day5SectionLabel(section)}
            </h3>
            <div className="rounded-md border bg-white p-3">
              <PreviewComponent
                content={readOnlySections[section]}
                emptyPlaceholder="No response provided for this section."
              />
            </div>
          </section>
        ))
      ) : (
        <div className="rounded-md border bg-white p-3">
          <PreviewComponent
            content={readOnlyFallbackMarkdown}
            emptyPlaceholder="No finalized reflection content is available."
          />
        </div>
      )}
    </div>
  );
}
