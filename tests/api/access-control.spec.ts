import { test, expect } from '@fixtures/index';

/**
 * Access control: a user must only be able to change their own content.
 * Each test uses two users: the author, and someone else ("other").
 */
test.describe('Access control API', () => {
  test('another user cannot edit an article', async ({ api, user: author, createUser, createArticle }) => {
    const other = await createUser();
    const article = await createArticle(author);

    const response = await api.updateArticleRaw(other.token, article.slug, { title: 'Changed by someone else' });

    expect(response.status()).toBe(403);
    // Check the article really did not change.
    const unchanged = await (await api.getArticleRaw(article.slug)).json();
    expect(unchanged.article.title).toBe(article.title);
  });

  test('another user cannot delete an article', async ({ api, user: author, createUser, createArticle }) => {
    const other = await createUser();
    const article = await createArticle(author);

    const response = await api.deleteArticleRaw(other.token, article.slug);

    expect(response.status()).toBe(403);
    expect((await api.getArticleRaw(article.slug)).status()).toBe(200);
  });

  test('another user cannot delete a comment', async ({ api, user: author, createUser, createArticle }) => {
    const other = await createUser();
    const article = await createArticle(author);
    const comment = await api.addComment(author.token, article.slug, 'Comment by the author');

    const response = await api.deleteCommentRaw(other.token, article.slug, comment.id);

    expect(response.status()).toBe(403);
    const comments = (await (await api.listCommentsRaw(article.slug)).json()).comments;
    expect(comments.map((c: { id: number }) => c.id)).toContain(comment.id);
  });

  test('the author can delete their own comment', async ({ api, user: author, createArticle }) => {
    const article = await createArticle(author);
    const comment = await api.addComment(author.token, article.slug, 'Temporary comment');

    const response = await api.deleteCommentRaw(author.token, article.slug, comment.id);

    expect(response.status()).toBe(200);
    const comments = (await (await api.listCommentsRaw(article.slug)).json()).comments;
    expect(comments).toHaveLength(0);
  });
});
