import { Locator, Page } from '@playwright/test';

/** A single article, with its comments. */
export class ArticlePage {
  readonly title: Locator;
  readonly content: Locator;
  readonly tags: Locator;
  readonly deleteButton: Locator;
  readonly editLink: Locator;
  readonly commentInput: Locator;
  readonly postCommentButton: Locator;
  readonly comments: Locator;

  constructor(private readonly page: Page) {
    this.title = page.locator('.banner').getByRole('heading', { level: 1 });
    this.content = page.locator('.article-content');
    this.tags = this.content.locator('.tag-list li');
    // The author buttons appear twice (above and below the article); use the first.
    this.deleteButton = page.getByRole('button', { name: 'Delete Article' }).first();
    this.editLink = page.getByRole('link', { name: 'Edit Article' }).first();
    this.commentInput = page.getByPlaceholder('Write a comment...');
    this.postCommentButton = page.getByRole('button', { name: 'Post Comment' });
    this.comments = page.locator('.card').filter({ has: page.locator('.card-text') });
  }

  async goto(slug: string): Promise<void> {
    await this.page.goto(`/#/article/${slug}`);
  }

  comment(text: string): Locator {
    return this.comments.filter({ hasText: text });
  }

  async addComment(text: string): Promise<void> {
    await this.commentInput.fill(text);
    await this.postCommentButton.click();
  }

  /** The app asks "Are you sure?" in a browser dialog. This accepts it. */
  async deleteComment(text: string): Promise<void> {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.comment(text).getByRole('button').click();
  }

  async deleteArticle(): Promise<void> {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.deleteButton.click();
  }
}
