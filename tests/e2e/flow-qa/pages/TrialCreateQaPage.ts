import type { Page } from '@playwright/test';
import { BasePage } from '../../pages/BasePage';

export class TrialCreateQaPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoCreate() {
    await this.goto('/dashboard/trials/new');
  }

  async fillTitle(value: string) {
    await this.fillByLabel(/role title/i, value);
  }

  async fillDescription(value: string) {
    await this.fillByLabel(/role description/i, value);
  }

  async fillPreferredLanguageFramework(value: string) {
    await this.fillByLabel(/preferred language\/framework/i, value);
  }

  async submitCreate() {
    await this.clickButton(/create trial/i);
  }
}
