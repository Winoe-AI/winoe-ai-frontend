import type { Page } from '@playwright/test';
import { BasePage } from '../../pages/BasePage';

export class SimulationDetailQaPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoDetail(simulationId: string) {
    await this.goto(`/dashboard/simulations/${simulationId}`);
  }

  async expectPlanSection() {
    await this.expectVisibleText(/5-day simulation plan/i);
  }

  async openInviteModal() {
    await this.clickButton(/invite candidate/i);
  }
}
