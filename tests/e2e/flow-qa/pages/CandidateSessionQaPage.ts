import type { Page } from '@playwright/test';
import { BasePage } from '../../pages/BasePage';

export class CandidateSessionQaPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoWithToken(token: string) {
    await this.goto(`/candidate/session/${token}`);
  }

  async startSimulation() {
    await this.clickButton(/start simulation/i);
  }

  async expectDay(day: number) {
    await this.expectVisibleText(new RegExp(`^Day ${day} •`, 'i'));
  }
}
