'use client';

import { scenarioVersionLabel } from '../utils/detail';
import type { ScenarioUiStatus, ScenarioVersionItem } from './types';

type Props = {
  versions: ScenarioVersionItem[];
  selectedVersionId: string | null;
  onSelectVersion: (versionId: string) => void;
};

function statusLabel(status: ScenarioUiStatus): string {
  if (status === 'ready_for_review') return 'ready_for_review';
  return status;
}

function statusClass(status: ScenarioUiStatus): string {
  if (status === 'approved') {
    return 'bg-green-100 text-green-800 border-green-200';
  }
  if (status === 'locked') {
    return 'bg-amber-100 text-amber-800 border-amber-200';
  }
  if (status === 'generating') {
    return 'bg-blue-100 text-blue-800 border-blue-200';
  }
  return 'bg-slate-100 text-slate-800 border-slate-200';
}

function availabilityLabel(
  availability: ScenarioVersionItem['contentAvailability'],
): string {
  if (availability === 'local_only') return 'local only';
  if (availability === 'unavailable') return 'content unavailable';
  return 'canonical';
}

export function ScenarioVersionSelector({
  versions,
  selectedVersionId,
  onSelectVersion,
}: Props) {
  if (!versions.length) {
    return null;
  }

  return (
    <div className="rounded border border-gray-200 bg-gray-50 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Scenario versions
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {versions.map((version) => {
          const selected = version.id === selectedVersionId;
          const label = scenarioVersionLabel(version.versionIndex);
          return (
            <button
              key={version.id}
              type="button"
              className={[
                'inline-flex items-center gap-2 rounded border px-2.5 py-1.5 text-xs font-medium',
                selected
                  ? 'border-blue-300 bg-blue-50 text-blue-800'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
              ].join(' ')}
              onClick={() => onSelectVersion(version.id)}
              aria-pressed={selected}
              aria-label={`Select scenario ${label}`}
            >
              <span>{label}</span>
              <span
                className={[
                  'rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide',
                  statusClass(version.uiStatus),
                ].join(' ')}
              >
                {statusLabel(version.uiStatus)}
              </span>
              {version.isActive ? (
                <span className="rounded border border-green-200 bg-green-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-green-700">
                  active
                </span>
              ) : null}
              {version.isPending ? (
                <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-blue-700">
                  pending
                </span>
              ) : null}
              {version.contentAvailability !== 'canonical' ? (
                <span className="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-700">
                  {availabilityLabel(version.contentAvailability)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
