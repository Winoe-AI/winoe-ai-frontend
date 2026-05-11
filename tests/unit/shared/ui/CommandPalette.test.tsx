import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandPalette } from '@/shared/ui/CommandPalette';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('CommandPalette', () => {
  beforeEach(() => {
    push.mockReset();
    window.localStorage.clear();
  });

  it('shows navigate-to trial results from provided trials', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button">Before</button>
        <CommandPalette
          trials={[
            {
              id: 't1',
              title: 'Backend Engineer Trial',
              company: 'Winoe',
              candidateNames: ['Jordan Doe'],
            },
          ]}
        />
      </div>,
    );

    await user.keyboard('{Meta>}k{/Meta}');
    expect(
      screen.getByRole('dialog', { name: 'Command Palette' }),
    ).toBeVisible();
    expect(screen.getByText('Navigate to')).toBeInTheDocument();
    expect(
      screen.getAllByRole('option', { name: /Backend Engineer Trial/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole('option', { name: /Jordan Doe/i }),
    ).toBeInTheDocument();
  });

  it('supports esc close, tab trapping, arrow navigation, and enter activation', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button">Before</button>
        <CommandPalette
          trials={[{ id: 't1', title: 'Frontend Trial', company: 'Winoe' }]}
        />
        <button type="button">After</button>
      </div>,
    );

    await user.keyboard('{Control>}k{/Control}');
    const search = screen.getByRole('combobox', { name: 'Search commands' });
    expect(search).toHaveFocus();

    await user.tab({ shift: true });
    expect(
      screen.getByRole('button', { name: 'Close command palette' }),
    ).toHaveFocus();
    await user.tab();
    expect(search).toHaveFocus();

    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(push).toHaveBeenCalled();

    await user.keyboard('{Control>}k{/Control}');
    expect(
      screen.getByRole('dialog', { name: 'Command Palette' }),
    ).toBeVisible();
    await user.keyboard('{Escape}');
    expect(
      screen.queryByRole('dialog', { name: 'Command Palette' }),
    ).not.toBeInTheDocument();
  });
});
