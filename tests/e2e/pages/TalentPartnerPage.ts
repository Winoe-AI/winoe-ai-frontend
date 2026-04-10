import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class TalentPartnerPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoLogin() {
    await this.goto('/login');
  }

  async login() {
    await this.clickButton(/continue/i);
  }

  async expectDashboard() {
    await this.expectUrl('**/dashboard');
    await this.expectVisibleText(/trials/i);
    await this.expectRow();
  }

  private async expectRow() {
    await this.page.getByTestId('trial-row').waitFor({ state: 'visible' });
  }
}
