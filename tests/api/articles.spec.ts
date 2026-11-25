import { test, expect } from '@fixtures/index';
import { buildArticle } from '@data/factories';

test.describe('Articles API', () => {
  test('creates, reads, updates and deletes an article @smoke', async ({ api, user }) => {
    const draft = buildArticle();

    // Create
    const createResponse = await api.createArticleRaw(user.token, draft);
    expect(createResponse.status()).toBe(201);
    const created = (await createResponse.json()).article;
    expect(created).toMatchObject({
      title: draft.title,
      description: draft.description,
      body: draft.body,
      author: { username: user.username },
      favorited: false,
      favoritesCount: 0,
    });
    expect(created.tagList).toEqual(expect.arrayContaining(draft.tagList));

    // Read
    const getResponse = await api.getArticleRaw(created.slug);
    expect(getResponse.status()).toBe(200);
    expect((await getResponse.json()).article.title).toBe(draft.title);

    // Update
    const updateResponse = await api.updateArticleRaw(user.token, created.slug, { body: 'Updated body' });
    expect(updateResponse.status()).toBe(200);
    expect((await updateResponse.json()).article.body).toBe('Updated body');

    // Delete, then check it is really gone
    const deleteResponse = await api.deleteArticleRaw(user.token, created.slug);
    expect(deleteResponse.status()).toBe(200);
    expect((await api.getArticleRaw(created.slug)).status()).toBe(404);
  });

  test('returns 404 for an article that does not exist', async ({ api }) => {
    const response = await api.getArticleRaw('this-slug-does-not-exist-123');

    expect(response.status()).toBe(404);
    expect((await response.json()).errors.body[0]).toMatch(/not found/i);
  });

  test('requires a login to create an article', async ({ api }) => {
    const response = await api.createArticleRaw(null, buildArticle());

    expect(response.status()).toBe(401);
  });

  test('filters the article list by author and tag', async ({ api, user, createArticle }) => {
    const article = await createArticle(user);
    const uniqueTag = article.tagList.find((tag) => tag !== 'playwright')!;

    const byAuthor = await (await api.listArticlesRaw({ author: user.username })).json();
    expect(byAuthor.articles.map((a: { slug: string }) => a.slug)).toEqual([article.slug]);

    const byTag = await (await api.listArticlesRaw({ tag: uniqueTag })).json();
    expect(byTag.articles.map((a: { slug: string }) => a.slug)).toEqual([article.slug]);
  });

  test('respects the limit parameter', async ({ api, user, createArticle }) => {
    await createArticle(user);
    await createArticle(user);
    await createArticle(user);

    const response = await api.listArticlesRaw({ author: user.username, limit: 2 });
    const body = await response.json();

    expect(body.articles).toHaveLength(2);
  });

  // Known bug, see docs/findings/002-articles-count-includes-tags.md
  test('articlesCount matches the number of articles', async ({ api, user, createArticle }) => {
    test.fail(true, 'Finding 002: articlesCount counts tags, not articles');

    // Each test article has 2 tags, so the bug makes the count 6 instead of 3.
    await createArticle(user);
    await createArticle(user);
    await createArticle(user);

    const body = await (await api.listArticlesRaw({ author: user.username })).json();

    expect(body.articles).toHaveLength(3);
    expect(body.articlesCount).toBe(3);
  });

  test('favorites and unfavorites an article', async ({ api, user, createUser, createArticle }) => {
    const reader = await createUser();
    const article = await createArticle(user);

    const favorite = await (await api.favoriteRaw(reader.token, article.slug)).json();
    expect(favorite.article).toMatchObject({ favorited: true, favoritesCount: 1 });

    const unfavorite = await (await api.unfavoriteRaw(reader.token, article.slug)).json();
    expect(unfavorite.article).toMatchObject({ favorited: false, favoritesCount: 0 });
  });
});
