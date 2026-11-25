import { test, expect } from '@fixtures/index';
import { buildUser } from '@data/factories';

test.describe('Sign up, login and logout', () => {
  test('a visitor can sign up and is logged in afterwards @smoke @mobile', async ({ page, registerPage, navBar }) => {
    const newUser = buildUser();

    await registerPage.goto();
    await expect(registerPage.heading).toHaveText('Sign up');
    await registerPage.register(newUser);

    await expect(page).toHaveURL(/#\/$/);
    await expect(navBar.userMenu(newUser.username)).toBeVisible();
    await expect(navBar.newArticleLink).toBeVisible();
    await expect(navBar.loginLink).toBeHidden();
  });

  test('a registered user can log in @smoke @mobile', async ({ page, user, loginPage, navBar }) => {
    await loginPage.goto();
    await loginPage.login(user.email, user.password);

    await expect(page).toHaveURL(/#\/$/);
    await expect(navBar.userMenu(user.username)).toBeVisible();
  });

  test('shows an error for a wrong password', async ({ page, user, loginPage, navBar }) => {
    await loginPage.goto();
    await loginPage.login(user.email, 'wrong-password');

    await expect(loginPage.errorMessages).toHaveText('Wrong email/password combination');
    await expect(page).toHaveURL(/#\/login$/);
    await expect(navBar.loginLink).toBeVisible();
  });

  test('shows an error when the email is already taken', async ({ user, registerPage }) => {
    await registerPage.goto();
    await registerPage.register(buildUser({ email: user.email }));

    await expect(registerPage.errorMessages).toContainText(/email already exists/i);
  });

  test('a logged-in user can log out', async ({ user, loginPage, navBar }) => {
    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await expect(navBar.userMenu(user.username)).toBeVisible();

    await navBar.logout(user.username);

    await expect(navBar.loginLink).toBeVisible();
    await expect(navBar.userMenu(user.username)).toBeHidden();
  });
});
