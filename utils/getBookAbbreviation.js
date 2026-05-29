import { bibleBooks } from "./bibleBooks.js";

function getBookAbbreviation(title = "") {

  const normalizedTitle = normalize(title);

  for (const book of bibleBooks) {

    const normalizedBook = normalize(book.name);

    const regex = new RegExp(`\\b${normalizedBook}\\b`, "i");

    if (regex.test(normalizedTitle)) {
      return {
        book: book.name,
        abbreviation: book.abbr
      };
    }
  }

  return null;
}

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function buildReference(title) {

  const bookData = getBookAbbreviation(title);

  if (!bookData) return null;

  const cleanedTitle = title
    .split("R/.")[0]
    .trim();

  // Caso normal: Jn 3, 16-21
  const match = cleanedTitle.match(
    /(\d+)\s*,\s*([\dA-Za-z\-–\.\,\s]+)/
  );

  if (match) {
    return {
      ...bookData,
      reference: {
        chapter: Number(match[1]),
        verses: cleanVerses(match[2])
      }
    };
  }

  // Caso Salmo 95
  const psalmMatch = cleanedTitle.match(/(\d+)/);

  if (psalmMatch) {
    return {
      ...bookData,
      reference: {
        chapter: Number(psalmMatch[1]),
        verses: ""
      }
    };
  }

  return {
    ...bookData,
    reference: null
  };
}

function cleanVerses(text = "") {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.$/, "");
}