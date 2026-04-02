'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/shared/ui/Button';
import PageHeader from '@/shared/ui/PageHeader';
import { Card } from '@/shared/ui/Card';
import { PromptOverrideEditors } from '@/features/recruiter/ai/PromptOverrideEditors';
import {
  buildPromptOverrideFormValues,
  buildPromptOverridePayload,
} from '@/features/recruiter/ai/promptOverrideFormUtils';
import {
  readCompanyAiConfig,
  updateCompanyAiConfig,
} from '@/features/recruiter/api/companyAiConfigApi';

export default function CompanyAiSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('Your company');
  const [promptPackVersion, setPromptPackVersion] = useState<string>('unknown');
  const [values, setValues] = useState(() => buildPromptOverrideFormValues(null));

  useEffect(() => {
    let active = true;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const config = await readCompanyAiConfig();
        if (!active) return;
        setCompanyName(config.companyName);
        setPromptPackVersion(config.promptPackVersion);
        setValues(buildPromptOverrideFormValues(config.promptOverrides));
      } catch (caught: unknown) {
        if (!active) return;
        setError(
          caught instanceof Error
            ? caught.message
            : 'Unable to load AI settings right now.',
        );
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const subtitle = useMemo(
    () =>
      `Set company-wide default prompt and rubric overrides for ${companyName}. Blank fields inherit the versioned base pack.`,
    [companyName],
  );

  return (
    <main className="flex flex-col gap-6 py-8">
      <PageHeader
        title="AI Settings"
        subtitle={subtitle}
        actions={
          <Button type="button" onClick={() => router.push('/dashboard')}>
            Back
          </Button>
        }
      />

      <Card className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Company defaults
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            These overrides apply to all simulations unless a simulation-level
            override replaces them.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Base prompt pack: {promptPackVersion}
          </p>
        </div>

        {error ? (
          <div
            className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-2">
            <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-24 animate-pulse rounded bg-gray-100" />
            <div className="h-24 animate-pulse rounded bg-gray-100" />
          </div>
        ) : (
          <PromptOverrideEditors
            values={values}
            disabled={saving}
            onChange={(key, field, value) =>
              setValues((prev) => ({
                ...prev,
                [key]: {
                  ...prev[key],
                  [field]: value,
                },
              }))
            }
          />
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            loading={saving}
            disabled={loading || saving}
            onClick={() => {
              void (async () => {
                setSaving(true);
                setError(null);
                try {
                  const config = await updateCompanyAiConfig(
                    buildPromptOverridePayload(values, {
                      includeNullKeys: true,
                    }),
                  );
                  setCompanyName(config.companyName);
                  setPromptPackVersion(config.promptPackVersion);
                  setValues(buildPromptOverrideFormValues(config.promptOverrides));
                } catch (caught: unknown) {
                  setError(
                    caught instanceof Error
                      ? caught.message
                      : 'Unable to save AI settings right now.',
                  );
                } finally {
                  setSaving(false);
                }
              })();
            }}
          >
            Save defaults
          </Button>
        </div>
      </Card>
    </main>
  );
}
