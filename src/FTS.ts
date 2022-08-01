import { connect, Redis } from "https://deno.land/x/redis@v0.26.0/mod.ts";
import { getStemmer } from "https://deno.land/x/snowball_ts@v2.2.0/mod.ts";
import { stopwords } from "./stopwords.ts";
import { tokenize } from "./tokenize.ts";

export type RedisOpts = {
  hostname: string;
  port: number;
  password?: string;
  username?: string;
};

export type FTSOpts = {
  name: string;
  stemmer?: Parameters<typeof getStemmer>[0];
  stopwords?: keyof typeof stopwords;
};

export type SearchResult = {
  content: string;
  score: number;
  id: string;
};

export class FTS {
  private constructor(
    private redis: Redis,
    private redisOpts: RedisOpts,
    private tokenizer: (word: string) => Record<string, number>,
    private options: FTSOpts
  ) {}

  public static async get(redisOpts: RedisOpts, opts: FTSOpts): Promise<FTS> {
    const redis = await connect(redisOpts);
    const stopwords_list = stopwords[opts.stopwords || "english"];
    const stemmer = await getStemmer(opts.stemmer || "porter");
    const tokenizer = (word: string) =>
      tokenize(word, stopwords_list, stemmer.stem);
    return new FTS(redis, redisOpts, tokenizer, opts);
  }

  public getWordKey(word: string): string {
    return `fts:${this.options.name}:word:${word}`;
  }

  public getDocumentSetKey(id: string): string {
    return `fts:${this.options.name}:docset:${id}`;
  }

  public getDocumentKey(id: string): string {
    return `fts:${this.options.name}:doc:${id}`;
  }

  public async add(id: string, text: string): Promise<void> {
    const tokens = this.tokenizer(text);
    const newClient = await connect(this.redisOpts);
    const pipeline = newClient.pipeline();

    for (const [token, score] of Object.entries(tokens)) {
      // A sorted set of documents that contain this word
      pipeline.zadd(this.getWordKey(token), score, id);
      // A sorted set of words that are in this document
      pipeline.zadd(this.getDocumentSetKey(id), score, token);
      // The document itself
      pipeline.set(this.getDocumentKey(id), text);
    }

    await pipeline.flush();
    newClient.close();
  }

  public async remove(id: string): Promise<void> {
    const newClient = await connect(this.redisOpts);
    const pipeline = newClient.pipeline();
    const doc = await this.redis.get(this.getDocumentKey(id));
    if (!doc) {
      await pipeline.flush();
      newClient.close();
      return;
    }

    const tokens = this.tokenizer(doc);
    for (const token of Object.keys(tokens)) {
      pipeline.zrem(this.getWordKey(token), id);
      pipeline.zrem(this.getDocumentSetKey(id), token);
    }
    pipeline.del(this.getDocumentKey(id));

    await pipeline.flush();
    newClient.close();
  }

  public async search(query: string): Promise<SearchResult[]> {
    const tokenized = Object.keys(this.tokenizer(query));
    const matches = await this.redis.sendCommand(
      "ZINTER",
      tokenized.length,
      ...tokenized.map((token) => this.getWordKey(token)),
      "WITHSCORES"
    );

    const newClient = await connect(this.redisOpts);

    const results: SearchResult[] = [];
    const pipeline = newClient.pipeline();
    for (let i = 0; i < matches.array().length; i += 2) {
      const id = matches.array()[i];
      if (typeof id !== "string") {
        continue;
      }
      const score = matches.array()[i + 1];
      const doc = await this.redis.get(this.getDocumentKey(id));

      results.push({
        content: doc || "",
        id,
        score: Number(score),
      });
    }

    await pipeline.flush();
    newClient.close();
    return results.sort((a, b) => b.score - a.score);
  }

  public close(): void {
    return this.redis.close();
  }
}
