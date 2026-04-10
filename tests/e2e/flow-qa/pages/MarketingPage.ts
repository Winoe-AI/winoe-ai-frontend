import type { Page } from '@playwright/test';
import { BasePage } from '../../pages/BasePage';

export class MarketingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoHome() {
    await this.goto('/');
  }

  async expectSignedOutHome() {
    await this.expectHeading(/welcome to/i);
    await this.expectVisibleText(/talent-partner login/i);
    await this.expectVisibleText(/candidate portal/i);
  }
}
