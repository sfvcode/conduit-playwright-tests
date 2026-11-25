import { Locator, Page } from '@playwright/test';
import { NewArticle } from '@data/factories';

/** The page for writing a new article or editing an existing one. */
export class EditorPage {
  readonly title: Locator;
  readonly description: Locator;
  readonly body: Locator;
  readonly tags: Locator;
  readonly publishButton: Locator;
  readonly updateButton: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByPlaceholder('Article Title');
    this.description = page.getByPlaceholder("What's this article about?");
    this.body = page.getByPlaceholder('Write your article (in markdown)');
    this.tags = page.getByPlaceholder('Enter tags');
    this.publishButton = page.getByRole('button', { name: 'Publish Article' });
    this.updateButton = page.getByRole('button', { name: 'Update Article' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/#/editor');
  }

  async fill(article: NewArticle): Promise<void> {
    await this.title.fill(article.title);
    await this.description.fill(article.description);
    await this.body.fill(article.body);
    await this.tags.fill(article.tagList.join(','));
  }

  async publish(article: NewArticle): Promise<void> {
    await this.fill(article);
    await this.publishButton.click();
  }
}
