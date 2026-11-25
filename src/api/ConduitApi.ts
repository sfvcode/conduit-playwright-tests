import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { NewArticle, NewUser } from '@data/factories';

/** A logged-in user as returned by the API. */
export interface AuthUser {
  username: string;
  email: string;
  token: string;
  bio: string | null;
  image: string | null;
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  favorited: boolean;
  favoritesCount: number;
  author: { username: string };
}

/**
 * Small client for the Conduit REST API.
 *
 * Two kinds of methods:
 * - raw methods (e.g. `registerRaw`) return the response, so tests can check
 *   status codes, headers and error bodies;
 * - helper methods (e.g. `register`) check the call worked and return the data.
 *   Use them to set up test data quickly.
 */
export class ConduitApi {
  constructor(private readonly request: APIRequestContext) {}

  static authHeader(token: string): Record<string, string> {
    return { Authorization: `Token ${token}` };
  }

  // ---- Users ----

  registerRaw(user: Partial<NewUser>): Promise<APIResponse> {
    return this.request.post('users', { data: { user } });
  }

  loginRaw(email: string, password: string): Promise<APIResponse> {
    return this.request.post('users/login', { data: { user: { email, password } } });
  }

  currentUserRaw(headers: Record<string, string> = {}): Promise<APIResponse> {
    return this.request.get('user', { headers });
  }

  async register(user: NewUser): Promise<AuthUser> {
    const response = await this.registerRaw(user);
    expect(response.status(), await response.text()).toBe(201);
    return (await response.json()).user;
  }

  async login(email: string, password: string): Promise<AuthUser> {
    const response = await this.loginRaw(email, password);
    expect(response.status(), await response.text()).toBe(200);
    return (await response.json()).user;
  }

  // ---- Articles ----

  createArticleRaw(token: string | null, article: Partial<NewArticle>): Promise<APIResponse> {
    return this.request.post('articles', {
      data: { article },
      headers: token ? ConduitApi.authHeader(token) : {},
    });
  }

  getArticleRaw(slug: string): Promise<APIResponse> {
    return this.request.get(`articles/${slug}`);
  }

  updateArticleRaw(token: string, slug: string, changes: Partial<NewArticle>): Promise<APIResponse> {
    return this.request.put(`articles/${slug}`, {
      data: { article: changes },
      headers: ConduitApi.authHeader(token),
    });
  }

  deleteArticleRaw(token: string, slug: string): Promise<APIResponse> {
    return this.request.delete(`articles/${slug}`, { headers: ConduitApi.authHeader(token) });
  }

  listArticlesRaw(params: Record<string, string | number> = {}): Promise<APIResponse> {
    return this.request.get('articles', { params });
  }

  async createArticle(token: string, article: NewArticle): Promise<Article> {
    const response = await this.createArticleRaw(token, article);
    expect(response.status(), await response.text()).toBe(201);
    return (await response.json()).article;
  }

  // ---- Comments ----

  addCommentRaw(token: string, slug: string, body: string): Promise<APIResponse> {
    return this.request.post(`articles/${slug}/comments`, {
      data: { comment: { body } },
      headers: ConduitApi.authHeader(token),
    });
  }

  listCommentsRaw(slug: string): Promise<APIResponse> {
    return this.request.get(`articles/${slug}/comments`);
  }

  deleteCommentRaw(token: string, slug: string, id: number): Promise<APIResponse> {
    return this.request.delete(`articles/${slug}/comments/${id}`, {
      headers: ConduitApi.authHeader(token),
    });
  }

  async addComment(token: string, slug: string, body: string): Promise<{ id: number; body: string }> {
    const response = await this.addCommentRaw(token, slug, body);
    expect(response.status(), await response.text()).toBe(201);
    return (await response.json()).comment;
  }

  // ---- Tags ----

  async tags(): Promise<string[]> {
    const response = await this.request.get('tags');
    expect(response.status()).toBe(200);
    return (await response.json()).tags;
  }

  // ---- Favorites ----

  favoriteRaw(token: string, slug: string): Promise<APIResponse> {
    return this.request.post(`articles/${slug}/favorite`, { headers: ConduitApi.authHeader(token) });
  }

  unfavoriteRaw(token: string, slug: string): Promise<APIResponse> {
    return this.request.delete(`articles/${slug}/favorite`, { headers: ConduitApi.authHeader(token) });
  }
}
