import { Locator, Page } from '@playwright/test';

/** The top navigation bar, shown on every page. */
export class NavBar {
  readonly root: Locator;
  readonly homeLink: Locator;
  readonly loginLink: Locator;
  readonly signUpLink: Locator;
  readonly newArticleLink: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('nav.navbar');
    this.homeLink = this.root.getByRole('link', { name: 'Home' });
    this.loginLink = this.root.getByRole('link', { name: 'Login' });
    this.signUpLink = this.root.getByRole('link', { name: 'Sign up' });
    this.newArticleLink = this.root.getByRole('link', { name: 'New Article' });
  }

  /** The user menu shows the logged-in username. */
  userMenu(username: string): Locator {
    return this.root.getByText(username, { exact: true });
  }

  async logout(username: string): Promise<void> {
    await this.userMenu(username).click();
    await this.root.getByRole('link', { name: 'Logout' }).click();
  }
}
