import { test, expect } from '@fixtures/index';

test.describe('Comments in the UI', () => {
  test('a logged-in user can add and delete a comment @mobile', async ({
    page, user, loginAs, createArticle, articlePage,
  }) => {
    const article = await createArticle(user);
    const text = `Comment ${Date.now()}`;
    await loginAs(page, user);
    await articlePage.goto(article.slug);

    await articlePage.addComment(text);
    await expect(articlePage.comment(text)).toBeVisible();
    await expect(articlePage.commentInput).toHaveValue('');

    await articlePage.deleteComment(text);
    await expect(articlePage.comment(text)).toHaveCount(0);
  });

  test('a user cannot delete someone else\'s comment', async ({
    page, api, user: author, createUser, loginAs, createArticle, articlePage,
  }) => {
    const reader = await createUser();
    const article = await createArticle(author);
    await api.addComment(author.token, article.slug, 'Comment by the author');
    await loginAs(page, reader);

    await articlePage.goto(article.slug);

    const comment = articlePage.comment('Comment by the author');
    await expect(comment).toBeVisible();
    await expect(comment.getByRole('button')).toHaveCount(0);
  });

  test('visitors who are not logged in cannot comment', async ({ user, createArticle, articlePage }) => {
    const article = await createArticle(user);

    await articlePage.goto(article.slug);

    await expect(articlePage.title).toHaveText(article.title);
    await expect(articlePage.commentInput).toBeHidden();
  });
});
