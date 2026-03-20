/**
 * @jest-environment jsdom
 */

/**
 * GAP-FILLING TESTS: SimulationCreateForm
 *
 * Gap identified: Existing tests exercise create-simulation page flows, but there
 * is no direct component-level assertion coverage for:
 * - Field-level ARIA wiring (`aria-invalid` + `aria-describedby`)
 * - Direct input change callback contract per form key
 * - Action button disabled/submit behavior on submitting state
 *
 * Existing tests: tests/unit/features/recruiter/simulations/SimulationCreatePage.test.tsx
 * Coverage before: 100% lines/branches/functions/statements (quality gap only)
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CreateSimulationInput } from '@/features/recruiter/api';
import { SimulationCreateForm } from '@/features/recruiter/simulations/create/components/SimulationCreateForm';
import {
  initialValues,
  type FieldErrors,
  type FormValues,
} from '@/features/recruiter/simulations/create/utils/createFormConfig';

const seniorityOptions: CreateSimulationInput['seniority'][] = [
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
    <SimulationCreateForm
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

describe('SimulationCreateForm gap coverage', () => {
  it('wires label/error accessibility metadata and emits keyed change events', async () => {
    const user = userEvent.setup();
    const { onChange } = renderForm({
      errors: {
        title: 'Title is required.',
        techStack: 'Tech stack is required.',
      },
    });

    const titleInput = screen.getByLabelText('Title');
    const roleInput = screen.getByLabelText('Role');
    const stackInput = screen.getByLabelText('Tech stack');

    expect(titleInput).toHaveAttribute('aria-invalid', 'true');
    expect(titleInput).toHaveAttribute('aria-describedby', 'title-error');
    expect(screen.getByText('Title is required.')).toHaveAttribute(
      'id',
      'title-error',
    );

    expect(stackInput).toHaveAttribute('aria-invalid', 'true');
    expect(stackInput).toHaveAttribute('aria-describedby', 'techStack-error');
    expect(screen.getByText('Tech stack is required.')).toHaveAttribute(
      'id',
      'techStack-error',
    );

    await user.clear(roleInput);
    await user.type(roleInput, 'Principal Engineer');
    const roleCalls = onChange.mock.calls.filter(([key]) => key === 'role');
    expect(roleCalls.length).toBeGreaterThan(0);
    expect(roleCalls.at(-1)?.[1]).toEqual(expect.any(String));
  });

  it('submits/cancels when interactive and disables controls while submitting', async () => {
    const user = userEvent.setup();
    const interactive = renderForm();

    await user.click(
      screen.getByRole('button', { name: /Create simulation/i }),
    );
    expect(interactive.onSubmit).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(interactive.onCancel).toHaveBeenCalledTimes(1);

    interactive.unmount();
    renderForm({ isSubmitting: true });
    expect(screen.getByLabelText('Title')).toBeDisabled();
    expect(screen.getByRole('button', { name: /Creating…/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
  });
});
