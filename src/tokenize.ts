/**
 *   Given a document, split it into words, remove stopwords, stem remaining
 *   words, and return a map of words to their score, where score is the number
 *   of times the word appears in the document.
 */

export const tokenize = (
  str: string,
  stopwords: string[] = [],
  stemmer?: (word: string) => string
): Record<string, number> => {
  const words = str
    .normalize("NFD")
    // remove diacritics
    .replace(/[\u0300-\u036f]/g, "")
    // replace punctuation with space
    .replace(/[\.,;:"\'\\/!@#\$%\?\*\(\)\-=+\[\]\{\}_]/g, " ")
    .split(/\s+/g)
    .map((token) => token.toLowerCase())
    .filter((s) => s.length > 0 && !stopwords.includes(s))
    .map((word) => (stemmer ? stemmer(word) : word));

  const fraction = 1 / (words.length + 1);
  return words.reduce((acc, word) => {
    acc[word] = acc[word] ? acc[word] + fraction : fraction;
    return acc;
  }, {} as Record<string, number>);
};
