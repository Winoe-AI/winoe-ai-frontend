import type { Page } from '@playwright/test';
import { BasePage } from '../../pages/BasePage';

export class TrialDetailQaPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoDetail(trialId: string) {
    await this.goto(`/dashboard/trials/${trialId}`);
  }

  async expectPlanSection() {
    await this.expectVisibleText(/5-day trial plan/i);
  }

  async openInviteModal() {
    await this.clickButton(/invite candidate/i);
  }
}
