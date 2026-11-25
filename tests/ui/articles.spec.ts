import { test, expect } from '@fixtures/index';
import { buildArticle } from '@data/factories';

test.describe('Articles in the UI', () => {
  test('a user can publish an article and the API stores it @smoke @mobile', async ({
    page, api, user, loginAs, editorPage, articlePage,
  }) => {
    const draft = buildArticle();
    await loginAs(page, user);

    await editorPage.goto();
    await editorPage.publish(draft);

    // UI check: we land on the new article page.
    await expect(page).toHaveURL(/#\/article\//);
    await expect(articlePage.title).toHaveText(draft.title);
    await expect(articlePage.content).toContainText(draft.body);
    await expect(articlePage.tags).toHaveText(draft.tagList);

    // API check: the article was really saved, with the right author.
    const slug = decodeURIComponent(page.url().split('/article/')[1]);
    const saved = await (await api.getArticleRaw(slug)).json();
    expect(saved.article).toMatchObject({ title: draft.title, author: { username: user.username } });

    // Clean up
    await api.deleteArticleRaw(user.token, slug);
  });

  // Set up through the API, check in the UI: fast and stable.
  test('an article created through the API is shown correctly', async ({
    user, createArticle, articlePage,
  }) => {
    const article = await createArticle(user, { body: '## Heading\n\nSome **bold** text.' });

    await articlePage.goto(article.slug);

    await expect(articlePage.title).toHaveText(article.title);
    // The body is Markdown, so it should render as HTML.
    await expect(articlePage.content.getByRole('heading', { name: 'Heading' })).toBeVisible();
    await expect(articlePage.content.locator('strong')).toHaveText('bold');
  });

  test('the author can edit their article', async ({ page, user, loginAs, createArticle, articlePage, editorPage }) => {
    const article = await createArticle(user);
    await loginAs(page, user);

    await articlePage.goto(article.slug);
    await articlePage.editLink.click();
    await expect(editorPage.title).toHaveValue(article.title);
    await editorPage.body.fill('Edited body text');
    await editorPage.updateButton.click();

    await expect(articlePage.content).toContainText('Edited body text');
  });

  test('the author can delete their article', async ({ page, api, user, loginAs, createArticle, articlePage }) => {
    const article = await createArticle(user);
    await loginAs(page, user);

    await articlePage.goto(article.slug);
    await articlePage.deleteArticle();

    await expect(page).toHaveURL(/#\/$/);
    await expect.poll(async () => (await api.getArticleRaw(article.slug)).status()).toBe(404);
  });

  test('other users do not see the edit and delete buttons', async ({
    page, user: author, createUser, loginAs, createArticle, articlePage,
  }) => {
    const reader = await createUser();
    const article = await createArticle(author);
    await loginAs(page, reader);

    await articlePage.goto(article.slug);

    await expect(articlePage.title).toHaveText(article.title);
    await expect(articlePage.deleteButton).toBeHidden();
    await expect(articlePage.editLink).toBeHidden();
  });

  // The app shows only the first 50 tags from the API. This checks the sidebar
  // matches the API, however many tags the database holds.
  test('the sidebar shows the first 50 tags from the API, in order', async ({ page, api, user, createArticle, homePage }) => {
    await createArticle(user); // make sure at least one tag exists

    // Other tests add tags at the same time, so retry until the API and UI agree.
    await expect(async () => {
      await homePage.goto();
      await expect(homePage.popularTagButtons.first()).toBeVisible();
      const expected = (await api.tags()).slice(0, 50);
      await expect(homePage.popularTagButtons).toHaveText(expected, { timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
  });

  test('clicking a tag shows only articles with that tag', async ({ user, createArticle, homePage }) => {
    // Every test article has the "playwright" tag, so it is always among the first tags.
    await createArticle(user);

    await homePage.goto();
    await homePage.filterByTag('playwright');

    await expect(homePage.activeFeedTab).toContainText('playwright');
    await expect(homePage.articlePreviews.first()).toBeVisible();
    for (const preview of await homePage.articlePreviews.all()) {
      await expect(preview.locator('.tag-list li').filter({ hasText: /^playwright$/ })).toHaveCount(1);
    }
  });
});
