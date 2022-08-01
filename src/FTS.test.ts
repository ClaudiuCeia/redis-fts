import { assertObjectMatch } from "https://deno.land/std@0.120.0/testing/asserts.ts";
import { assertEquals } from "../../deno_std/testing/asserts.ts";
import { FTS } from "./FTS.ts";

Deno.test("FTS search", async () => {
  const fts = await FTS.get(
    {
      hostname: "127.0.0.1",
      port: 6379,
    },
    {
      name: "fts-test",
      stemmer: "porter",
      stopwords: "english",
    }
  );

  await Promise.all(
    [
      {
        id: "1",
        text: "In text retrieval, full-text search refers to techniques for searching a single computer-stored document or a collection in a full-text database. ",
      },
      {
        id: "2",
        text: "Full-text search is distinguished from searches based on metadata or on parts of the original texts represented in databases (such as titles, abstracts, selected sections, or bibliographical references). ",
      },
      {
        id: "3",
        text: "In a full-text search, a search engine examines all of the words in every stored document as it tries to match search criteria (for example, text specified by a user).",
      },
      {
        id: "4",
        text: "Full-text-searching techniques became common in online bibliographic databases in the 1990s",
      },
      {
        id: "5",
        text: "Many websites and application programs (such as word processing software) provide full-text-search capabilities",
      },
      {
        id: "6",
        text: "Some web search engines, such as AltaVista, employ full-text-search techniques, while others index only a portion of the web pages examined by their indexing systems",
      },
      {
        id: "7",
        text: "When dealing with a small number of documents, it is possible for the full-text-search engine to directly scan the contents of the documents with each query, a strategy called 'serial scanning'",
      },
    ].map((doc) => fts.add(doc.id, doc.text))
  );

  const results = await fts.search("database");

  assertObjectMatch(
    { results },
    {
      results: [
        {
          id: "4",
          score: 0.125,
        },
        {
          id: "1",
          score: 0.09090909090909091,
        },
        {
          id: "2",
          score: 0.0625,
        },
      ],
    }
  );

  fts.close();
});

Deno.test("FTS remove", async () => {
  const fts = await FTS.get(
    {
      hostname: "127.0.0.1",
      port: 6379,
    },
    {
      name: "fts-test-rem",
      stemmer: "porter",
      stopwords: "english",
    }
  );

  await Promise.all(
    [
      {
        id: "1",
        text: "In text retrieval, full-text search refers to techniques for searching a single computer-stored document or a collection in a full-text database. ",
      },
      {
        id: "2",
        text: "Full-text search is distinguished from searches based on metadata or on parts of the original texts represented in databases (such as titles, abstracts, selected sections, or bibliographical references). ",
      },
      {
        id: "3",
        text: "In a full-text search, a search engine examines all of the words in every stored document as it tries to match search criteria (for example, text specified by a user).",
      },
      {
        id: "4",
        text: "Full-text-searching techniques became common in online bibliographic databases in the 1990s",
      },
      {
        id: "5",
        text: "Many websites and application programs (such as word processing software) provide full-text-search capabilities",
      },
      {
        id: "6",
        text: "Some web search engines, such as AltaVista, employ full-text-search techniques, while others index only a portion of the web pages examined by their indexing systems",
      },
      {
        id: "7",
        text: "When dealing with a small number of documents, it is possible for the full-text-search engine to directly scan the contents of the documents with each query, a strategy called 'serial scanning'",
      },
    ].map((doc) => fts.add(doc.id, doc.text))
  );

  await fts.remove("1");

  const results = await fts.search("database");

  assertObjectMatch(
    { results },
    {
      results: [
        {
          id: "4",
          score: 0.125,
        },
        {
          id: "2",
          score: 0.0625,
        },
      ],
    }
  );

  fts.close();
});

Deno.test("FTS example", async () => {
  const fts = await FTS.get(
    {
      hostname: "127.0.0.1",
      port: 6379,
    },
    {
      name: "example",
      stemmer: "porter",
      stopwords: "english",
    }
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
        text: "The search engine will search for the word 'document' and return the document.",
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
    ].map((doc) => fts.add(doc.id, doc.text))
  );

  const results = await fts.search("document");

  assertEquals(
    { results },
    {
      results: [
        {
          content: "A document can be as short or as long as it needs to be.",
          id: "1",
          score: 0.3333333333333333,
        },
        {
          content:
            "The search engine will search for the word 'document' and return the document.",
          id: "3",
          score: 0.25,
        },
      ],
    }
  );

  fts.close();
});
