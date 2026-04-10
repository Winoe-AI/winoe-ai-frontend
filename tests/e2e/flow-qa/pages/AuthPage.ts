import type { Page } from '@playwright/test';
import { BasePage } from '../../pages/BasePage';

export class AuthPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoLogin(query?: string) {
    await this.goto(`/auth/login${query ? `?${query}` : ''}`);
  }

  async gotoError(query?: string) {
    await this.goto(`/auth/error${query ? `?${query}` : ''}`);
  }

  async gotoNotAuthorized(query?: string) {
    await this.goto(`/not-authorized${query ? `?${query}` : ''}`);
  }

  async expectLoginHeading() {
    await this.expectHeading(
      /sign in to continue your trial|talent_partner login/i,
    );
  }

  async expectAuthErrorHeading() {
    await this.expectHeading(/sign-in failed/i);
  }
}
