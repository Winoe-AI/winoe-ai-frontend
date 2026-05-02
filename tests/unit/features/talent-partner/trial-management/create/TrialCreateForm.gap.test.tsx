/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CreateTrialInput } from '@/features/talent-partner/api';
import { TrialCreateForm } from '@/features/talent-partner/trial-management/create/components/TrialCreateForm';
import {
  initialValues,
  type FieldErrors,
  type FormValues,
} from '@/features/talent-partner/trial-management/create/utils/createFormConfigUtils';
const seniorityOptions: CreateTrialInput['seniority'][] = [
  'junior',
  'mid',
  'senior',
  'staff',
  'principal',
];
const renderForm = (overrides?: {
  values?: FormValues;
  errors?: FieldErrors;
  isSubmitting?: boolean;
  onChange?: jest.Mock;
  onSubmit?: jest.Mock;
  onCancel?: jest.Mock;
}) => {
  const onChange = overrides?.onChange ?? jest.fn();
  const onSubmit =
    overrides?.onSubmit ??
    jest.fn((event: React.FormEvent<HTMLFormElement>) =>
      event.preventDefault(),
    );
  const onCancel = overrides?.onCancel ?? jest.fn();
  const utils = render(
    <TrialCreateForm
      values={overrides?.values ?? initialValues}
      errors={overrides?.errors ?? {}}
      isSubmitting={overrides?.isSubmitting ?? false}
      seniorityOptions={seniorityOptions}
      onChange={onChange}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />,
  );
  return { onChange, onSubmit, onCancel, ...utils };
};
describe('TrialCreateForm gap coverage', () => {
  it('wires label/error accessibility metadata and emits keyed change events', async () => {
    const user = userEvent.setup();
    const { onChange } = renderForm({
      errors: {
        title: 'Role title is required.',
      },
    });
    const titleInput = screen.getByLabelText('Role title');
    const roleInput = screen.getByLabelText('Role description');
    const stackInput = screen.getByRole('textbox', {
      name: 'Preferred Language/Framework',
    });
    expect(titleInput).toHaveAttribute('aria-invalid', 'true');
    expect(titleInput).toHaveAttribute('aria-describedby', 'title-error');
    expect(screen.getByText('Role title is required.')).toHaveAttribute(
      'id',
      'title-error',
    );
    expect(
      screen.getByText(
        'Optional. Helps Winoe generate a relevant project brief. Candidates may use any stack.',
      ),
    ).toBeInTheDocument();
    expect((stackInput as HTMLInputElement).type).toBe('text');
    expect(stackInput).toHaveAttribute(
      'aria-describedby',
      'preferredLanguageFramework-help',
    );
    expect(
      screen.queryByRole('combobox', {
        name: 'Preferred Language/Framework',
      }),
    ).toBeNull();
    expect(
      screen.queryByRole('combobox', { name: /template repository/i }),
    ).toBeNull();
    expect(screen.queryByRole('combobox', { name: /tech stack/i })).toBeNull();
    expect(screen.queryByRole('option', { name: /node/i })).toBeNull();
    expect(screen.queryByRole('option', { name: /python/i })).toBeNull();
    await user.clear(stackInput);
    await user.type(stackInput, 'Node.js');
    const preferredCalls = onChange.mock.calls.filter(
      ([key]) => key === 'preferredLanguageFramework',
    );
    expect(preferredCalls.length).toBeGreaterThan(0);
    expect(preferredCalls.at(-1)?.[1]).toEqual(expect.any(String));
    await user.clear(roleInput);
    await user.type(roleInput, 'Principal Engineer');
    const roleCalls = onChange.mock.calls.filter(([key]) => key === 'role');
    expect(roleCalls.length).toBeGreaterThan(0);
    expect(roleCalls.at(-1)?.[1]).toEqual(expect.any(String));
  });

  it('collapses advanced settings by default and expands on demand', async () => {
    const user = userEvent.setup();
    renderForm();

    const toggle = screen.getByRole('button', {
      name: /show advanced settings/i,
    });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByText(/candidate notice version/i),
    ).not.toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/candidate notice version/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^day 1$/i)).toBeInTheDocument();
  });

  it('auto-expands advanced settings when advanced validation errors are present', () => {
    renderForm({
      errors: {
        noticeVersion: 'Notice version is required.',
        evalDay4: 'Day 4 toggle must be true or false.',
      },
    });

    expect(
      screen.getByRole('button', { name: /hide advanced settings/i }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/candidate notice version/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Day 4 toggle must be true or false/i),
    ).toBeInTheDocument();
  });

  it('does not render retired template or tech stack selectors', () => {
    renderForm();

    expect(
      screen.queryByRole('combobox', { name: /template repository/i }),
    ).toBeNull();
    expect(screen.queryByRole('combobox', { name: /tech stack/i })).toBeNull();
  });

  it('submits/cancels when interactive and disables controls while submitting', async () => {
    const user = userEvent.setup();
    const interactive = renderForm();
    await user.click(screen.getByRole('button', { name: /Create trial/i }));
    expect(interactive.onSubmit).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(interactive.onCancel).toHaveBeenCalledTimes(1);
    interactive.unmount();
    renderForm({ isSubmitting: true });
    expect(screen.getByLabelText('Role title')).toBeDisabled();
    expect(screen.getByRole('button', { name: /Creating…/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
  });
});
