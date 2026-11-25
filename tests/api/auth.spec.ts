import { test, expect } from '@fixtures/index';
import { ConduitApi } from '@api/ConduitApi';
import { buildUser } from '@data/factories';

test.describe('Users and authentication API', () => {
  test('registers a new user and returns a token @smoke', async ({ api }) => {
    const newUser = buildUser();

    const response = await api.registerRaw(newUser);

    expect(response.status()).toBe(201);
    expect(response.headers()['content-type']).toContain('application/json');
    const { user } = await response.json();
    expect(user).toMatchObject({ username: newUser.username, email: newUser.email });
    // A JWT has three dot-separated parts.
    expect(user.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(user).not.toHaveProperty('password');
  });

  test('logs in with valid credentials @smoke', async ({ api, user }) => {
    const response = await api.loginRaw(user.email, user.password);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.user.username).toBe(user.username);
    expect(body.user.token).toBeTruthy();
  });

  test('rejects a wrong password', async ({ api, user }) => {
    const response = await api.loginRaw(user.email, 'wrong-password');

    expect(response.status()).toBe(422);
    expect((await response.json()).errors.body).toContain('Wrong email/password combination');
  });

  test('rejects registering an email that already exists', async ({ api, user }) => {
    const response = await api.registerRaw(buildUser({ email: user.email }));

    expect(response.status()).toBe(422);
    expect((await response.json()).errors.body[0]).toMatch(/email already exists/i);
  });

  const missingFields = [
    { field: 'username', message: /username is required/i },
    { field: 'email', message: /email is required/i },
    { field: 'password', message: /password is required/i },
  ] as const;

  for (const { field, message } of missingFields) {
    test(`rejects registration without a ${field}`, async ({ api }) => {
      const { [field]: _omitted, ...incomplete } = buildUser();

      const response = await api.registerRaw(incomplete);

      expect(response.status()).toBe(422);
      expect((await response.json()).errors.body[0]).toMatch(message);
    });
  }

  test('returns the current user for a valid token', async ({ api, user }) => {
    const response = await api.currentUserRaw(ConduitApi.authHeader(user.token));

    expect(response.status()).toBe(200);
    expect((await response.json()).user.email).toBe(user.email);
  });

  test('returns 401 when no token is sent', async ({ api }) => {
    const response = await api.currentUserRaw();

    expect(response.status()).toBe(401);
  });

  // Known bug, see docs/findings/001-invalid-token-returns-500.md
  // test.fail() means: "this test is expected to fail for now".
  // When the bug is fixed, Playwright reports it as an unexpected pass,
  // which tells us to retest and remove this marker.
  test('returns 401 for an invalid token', async ({ api }) => {
    test.fail(true, 'Finding 001: the API answers 500 instead of 401');

    const response = await api.currentUserRaw({ Authorization: 'Token not.a.realtoken' });

    expect(response.status()).toBe(401);
  });
});
