'use client';

import { useRouter } from 'next/navigation';
import Button from '@/shared/ui/Button';
import PageHeader from '@/shared/ui/PageHeader';
import { TrialCreateForm } from './components/TrialCreateForm';
import { useTrialCreateForm } from './hooks/useTrialCreateForm';

export default function TrialCreatePage() {
  const router = useRouter();
  const form = useTrialCreateForm((id) =>
    router.push(`/dashboard/trials/${encodeURIComponent(id)}`),
  );

  return (
    <main className="flex flex-col gap-6 py-8">
      <PageHeader
        title="New Trial"
        subtitle="Create a new 5-day trial."
        actions={
          <Button type="button" onClick={() => router.push('/dashboard')}>
            Back
          </Button>
        }
      />

      <TrialCreateForm
        values={form.values}
        errors={form.errors}
        isSubmitting={form.isSubmitting}
        seniorityOptions={form.seniorityOptions}
        onChange={form.setField}
        onPromptOverrideChange={form.setPromptOverride}
        onSubmit={form.handleSubmit}
        onCancel={() => router.push('/dashboard')}
      />
    </main>
  );
}
