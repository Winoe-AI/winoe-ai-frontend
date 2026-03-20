import type { Page } from '@playwright/test';
import { BasePage } from '../../pages/BasePage';

export class SimulationCreateQaPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoCreate() {
    await this.goto('/dashboard/simulations/new');
  }

  async fillTitle(value: string) {
    await this.fillByLabel(/title/i, value);
  }

  async submitCreate() {
    await this.clickButton(/create simulation/i);
  }
}
