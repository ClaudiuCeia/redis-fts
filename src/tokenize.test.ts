import {
  assertEquals,
  assertObjectMatch,
} from "https://deno.land/std@0.120.0/testing/asserts.ts";
import { getStemmer } from "https://deno.land/x/snowball_ts@v2.2.0/mod.ts";
import { tokenize } from "./tokenize.ts";

Deno.test("Tokenize", () => {
  const tokens = tokenize(
    "München is a city in Germany. It is the capital of Bavaria."
  );
  assertObjectMatch(tokens, {
    a: 0.07692307692307693,
    bavaria: 0.07692307692307693,
    capital: 0.07692307692307693,
    city: 0.07692307692307693,
    germany: 0.07692307692307693,
    in: 0.07692307692307693,
    is: 0.15384615384615385,
    it: 0.07692307692307693,
    munchen: 0.07692307692307693,
    of: 0.07692307692307693,
    the: 0.07692307692307693,
  });
});

Deno.test("Tokenize with stopwords", () => {
  const tokens = tokenize(
    "München is a city in Germany. It is the capital of Bavaria.",
    ["is", "a", "in", "it", "the", "of"]
  );
  assertObjectMatch(tokens, {
    bavaria: 0.16666666666666666,
    capital: 0.16666666666666666,
    city: 0.16666666666666666,
    germany: 0.16666666666666666,
    munchen: 0.16666666666666666,
  });
});

Deno.test("Tokenize with stopwords and stemmer", async () => {
  const stemmer = await getStemmer("english");
  const tokens = tokenize(
    "München is a city in Germany. It is the capital of Bavaria.",
    ["is", "a", "in", "it", "the", "of"],
    stemmer.stem
  );
  assertEquals(tokens, {
    bavaria: 0.16666666666666666,
    capit: 0.16666666666666666,
    citi: 0.16666666666666666,
    germani: 0.16666666666666666,
    munchen: 0.16666666666666666,
  });
});

Deno.test("Tokenize with stemmer only", async () => {
  const stemmer = await getStemmer("english");
  const tokens = tokenize(
    "München is a city in Germany. It is the capital of Bavaria.",
    [],
    stemmer.stem
  );
  assertEquals(tokens, {
    a: 0.07692307692307693,
    bavaria: 0.07692307692307693,
    capit: 0.07692307692307693,
    citi: 0.07692307692307693,
    germani: 0.07692307692307693,
    in: 0.07692307692307693,
    is: 0.15384615384615385,
    it: 0.07692307692307693,
    munchen: 0.07692307692307693,
    of: 0.07692307692307693,
    the: 0.07692307692307693,
  });
});
