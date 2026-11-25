import { Locator, Page } from '@playwright/test';
import { NewUser } from '@data/factories';

/** Shared parts of the "Sign in" and "Sign up" pages. */
abstract class AuthPage {
  readonly heading: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly errorMessages: Locator;

  constructor(protected readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.email = page.getByPlaceholder('Email');
    this.password = page.getByPlaceholder('Password');
    this.errorMessages = page.locator('.error-messages');
  }
}

export class LoginPage extends AuthPage {
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.submitButton = page.getByRole('button', { name: 'Login' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/#/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submitButton.click();
  }
}

export class RegisterPage extends AuthPage {
  readonly username: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.username = page.getByPlaceholder('Your Name');
    this.submitButton = page.getByRole('button', { name: 'Sign up' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/#/register');
  }

  async register(user: NewUser): Promise<void> {
    await this.username.fill(user.username);
    await this.email.fill(user.email);
    await this.password.fill(user.password);
    await this.submitButton.click();
  }
}
