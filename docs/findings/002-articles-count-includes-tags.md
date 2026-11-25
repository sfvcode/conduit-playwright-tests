# Finding 002: `articlesCount` counts tags, not articles

| | |
|---|---|
| **Area** | `GET /api/articles` (article list and pagination) |
| **Severity** | Medium |
| **Status** | Open |
| **Test** | `tests/api/articles.spec.ts` › "articlesCount matches the number of articles" (marked `test.fail`) |

## Summary

`articlesCount` in the article list response should be the total number of
matching articles. Instead, each article is counted once **per tag**.
An article with 3 tags adds 3 to the count. An article with no tags adds 1.

## Steps to reproduce

1. Register a user and create **one** article with **three** tags:

   ```sh
   curl -s -X POST http://localhost:3001/api/articles \
     -H "Content-Type: application/json" \
     -H "Authorization: Token <token>" \
     -d '{"article":{"title":"Count test","description":"d","body":"b","tagList":["a1","a2","a3"]}}'
   ```

2. List that user's articles:

   ```sh
   curl -s "http://localhost:3001/api/articles?author=<username>"
   ```

## Expected result

```json
{ "articles": [ ... 1 article ... ], "articlesCount": 1 }
```

## Actual result

```json
{ "articles": [ ... 1 article ... ], "articlesCount": 3 }
```

| Tags on the article | `articlesCount` returned |
|---|---|
| 0 | 1 |
| 1 | 1 |
| 3 | 3 |

## Why it matters

The home page uses `articlesCount` to build its page links, so it shows
extra pages that are empty.

## Likely cause

The count query joins articles with tags, so each article–tag pair is counted
as one row. Counting distinct articles (for example, Sequelize's `distinct: true`
in `findAndCountAll`) would likely fix it.
