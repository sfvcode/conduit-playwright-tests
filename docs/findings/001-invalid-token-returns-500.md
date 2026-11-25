# Finding 001: An invalid token returns 500 instead of 401

| | |
|---|---|
| **Area** | Authentication, all endpoints that read a token |
| **Severity** | Medium |
| **Status** | Open |
| **Test** | `tests/api/auth.spec.ts` › "returns 401 for an invalid token" (marked `test.fail`) |

## Summary

When a request sends a token that is not a valid JWT, the API answers
**500 Internal Server Error** with the message `invalid token`.
It should answer **401 Unauthorized**, as it already does when no token is sent.

## Steps to reproduce

1. Start the app (`npm run app:start`).
2. Send a request with a broken token:

   ```sh
   curl -i http://localhost:3001/api/user -H "Authorization: Token not.a.realtoken"
   ```

## Expected result

`401 Unauthorized`, the same as a request without a token:

```json
{ "errors": { "body": ["You need to login first!"] } }
```

## Actual result

```
HTTP/1.1 500 Internal Server Error
{"errors":{"body":["invalid token"]}}
```

## Why it matters

- A 500 says "the server broke", so monitoring treats it as an outage, not as a bad request.
- Clients can't tell an expired or forged token apart from a real server error,
  so they can't send the user back to the login page.
- Unhandled errors on auth paths can leak details about the server.

## Retest

Remove `test.fail(...)` from the test once the bug is fixed. If the fix works,
the test passes. While the bug exists, Playwright reports this test as an
"expected failure". If it starts passing unexpectedly, the run fails, which
is the signal to retest.
