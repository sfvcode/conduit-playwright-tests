import { test as base, expect, Page } from '@playwright/test';
import { Article, AuthUser, ConduitApi } from '@api/ConduitApi';
import { buildArticle, buildUser, NewArticle, NewUser } from '@data/factories';
import { ArticlePage } from '@pages/ArticlePage';
import { LoginPage, RegisterPage } from '@pages/AuthPages';
import { EditorPage } from '@pages/EditorPage';
import { HomePage } from '@pages/HomePage';
import { NavBar } from '@pages/NavBar';

/** A user created through the API, with the password kept for UI logins. */
export type TestUser = AuthUser & { password: string };

interface Fixtures {
  /** API client. Works in both the API and the UI projects. */
  api: ConduitApi;
  /** A fresh user, registered through the API before the test starts. */
  user: TestUser;
  /** Creates more users when a test needs two (e.g. author and reader). */
  createUser: (overrides?: Partial<NewUser>) => Promise<TestUser>;
  /** Creates an article through the API and deletes it after the test. */
  createArticle: (author: TestUser, overrides?: Partial<NewArticle>) => Promise<Article>;
  /** Logs a user in through the browser's storage, skipping the login form. */
  loginAs: (page: Page, user: TestUser) => Promise<void>;

  navBar: NavBar;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  homePage: HomePage;
  editorPage: EditorPage;
  articlePage: ArticlePage;
}

const apiBaseUrl = `${process.env.BASE_URL ?? 'http://localhost:3001'}/api/`;

export const test = base.extend<Fixtures>({
  api: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({ baseURL: apiBaseUrl });
    await use(new ConduitApi(context));
    await context.dispose();
  },

  createUser: async ({ api }, use) => {
    await use(async (overrides = {}) => {
      const data = buildUser(overrides);
      const created = await api.register(data);
      return { ...created, password: data.password };
    });
  },

  user: async ({ createUser }, use) => {
    await use(await createUser());
  },

  createArticle: async ({ api }, use) => {
    const created: { slug: string; token: string }[] = [];
    await use(async (author, overrides = {}) => {
      const article = await api.createArticle(author.token, buildArticle(overrides));
      created.push({ slug: article.slug, token: author.token });
      return article;
    });
    // Clean up, so test data doesn't pile up between runs.
    // A test may already have deleted its article, so 404 is fine here.
    for (const { slug, token } of created) {
      await api.deleteArticleRaw(token, slug);
    }
  },

  loginAs: async ({}, use) => {
    await use(async (page, user) => {
      // The app keeps the session in localStorage under "loggedUser".
      // Setting it before the page loads is much faster than filling in the login form.
      const session = {
        headers: { Authorization: `Token ${user.token}` },
        isAuth: true,
        loggedUser: { username: user.username, email: user.email, token: user.token, bio: user.bio, image: user.image },
      };
      await page.addInitScript((value) => {
        window.localStorage.setItem('loggedUser', value);
      }, JSON.stringify(session));
    });
  },

  navBar: async ({ page }, use) => use(new NavBar(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  registerPage: async ({ page }, use) => use(new RegisterPage(page)),
  homePage: async ({ page }, use) => use(new HomePage(page)),
  editorPage: async ({ page }, use) => use(new EditorPage(page)),
  articlePage: async ({ page }, use) => use(new ArticlePage(page)),
});

export { expect };
