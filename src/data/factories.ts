/**
 * Test data builders.
 * Every call returns unique values, so tests can run in parallel
 * and never clash with data left over from earlier runs.
 */

export interface NewUser {
  username: string;
  email: string;
  password: string;
}

export interface NewArticle {
  title: string;
  description: string;
  body: string;
  tagList: string[];
}

function uniqueId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function buildUser(overrides: Partial<NewUser> = {}): NewUser {
  const id = uniqueId();
  return {
    username: `qa_${id}`,
    email: `qa_${id}@example.com`,
    password: 'Str0ng-Passw0rd!',
    ...overrides,
  };
}

export function buildArticle(overrides: Partial<NewArticle> = {}): NewArticle {
  const id = uniqueId();
  return {
    title: `Test article ${id}`,
    description: `Description for ${id}`,
    body: `This is the body of test article ${id}.`,
    tagList: ['playwright', `tag${id}`],
    ...overrides,
  };
}
