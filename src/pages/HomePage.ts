import { Locator, Page } from '@playwright/test';

/** The home page: article feeds and the popular tags sidebar. */
export class HomePage {
  readonly globalFeedTab: Locator;
  readonly yourFeedTab: Locator;
  readonly popularTags: Locator;
  readonly popularTagButtons: Locator;
  readonly articlePreviews: Locator;
  readonly activeFeedTab: Locator;

  constructor(private readonly page: Page) {
    this.globalFeedTab = page.getByText('Global Feed');
    this.yourFeedTab = page.getByText('Your Feed');
    this.popularTags = page.locator('.sidebar .tag-list');
    this.popularTagButtons = this.popularTags.getByRole('button');
    // "No articles available." uses the same CSS class, so only count real previews.
    this.articlePreviews = page.locator('.article-preview').filter({ has: page.locator('.preview-link') });
    this.activeFeedTab = page.locator('.feed-toggle .nav-link.active');
  }

  async goto(): Promise<void> {
    await this.page.goto('/#/');
  }

  preview(title: string): Locator {
    return this.articlePreviews.filter({ has: this.page.getByRole('heading', { name: title }) });
  }

  async filterByTag(tag: string): Promise<void> {
    await this.popularTags.getByRole('button', { name: tag, exact: true }).click();
  }
}
