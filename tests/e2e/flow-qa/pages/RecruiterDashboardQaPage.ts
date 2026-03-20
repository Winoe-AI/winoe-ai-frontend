import type { Page } from '@playwright/test';
import { BasePage } from '../../pages/BasePage';

export class RecruiterDashboardQaPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoDashboard() {
    await this.goto('/dashboard');
  }

  async expectDashboardLoaded() {
    await this.expectHeading(/dashboard/i);
    await this.expectVisibleText(/simulations/i);
    await this.expectVisibleText(/recruiter qa/i);
  }

  async openInviteModal() {
    await this.clickButton(/invite candidate/i);
  }
}
