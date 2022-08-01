# redis-fts

A lightweight implementation of the Redis
[full-text search indexing pattern](https://redis.com/redis-best-practices/indexing-patterns/full-text-search/).
This is useful if you're using a managed Redis instance with no access to Redis
modules (ie: AWS Elasticache, DO managed database droplet, etc.) so RedisSearch
isn't available.

## Example

```ts
const fts = await FTS.get(
  {
    hostname: "127.0.0.1",
    port: 6379,
  },
  {
    name: "example",
    stemmer: "porter",
    stopwords: "english",
  },
);

await Promise.all(
  [
    {
      id: "1",
      text: "A document can be as short or as long as it needs to be.",
    },
    {
      id: "2",
      text: "It will be stemmed and indexed.",
    },
    {
      id: "3",
      text:
        "The search engine will search for the word 'document' and return the document.",
    },
    {
      id: "4",
      text: "The results will be sorted by relevance.",
    },
    {
      id: "5",
      text: "All of this is done without any configuration.",
    },
    {
      id: "6",
      text: "Only using Redis sorted sets.",
    },
  ].map((doc) => fts.add(doc.id, doc.text)),
);

const results = await fts.search("document");

/** [
 *    {
 *      content: "A document can be as short or as long as it needs to be.",
 *      id: "1",
 *      score: 0.3333333333333333,
 *    },
 *    {
 *      content:
 *        "The search engine will search for the word 'document' and return the document.",
 *      id: "3",
 *      score: 0.25,
 *    },
 *  ],
 */
```

## Stemmer and stopwords

`redis-fts` uses a [Snowball port](https://github.com/ClaudiuCeia/snowball-ts)
for stemming. It expects a selection of the correct stemmer to use, falling back
on using the Porter stemmer if none was specified. You can also specify which
stopwords list to use (you can see the full list in
[here](/src/stopwords/stopwords-iso.json).

## License

`redis-fts` is copyright (c) 2022 Claudiu Ceia, and is licensed under the MIT
license: see the associated "[LICENSE](/LICENSE)" for the full text.

The `stopwords-iso` list is copyright (c) 2020 Gene Diaz, and is licensed under
the MIT license: see the associated "[LICENSE](/src/stopwords/LICENSE)" for the
full text.
