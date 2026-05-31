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
    .replace(bookData.book, "")
    .trim();

  const match = cleanedTitle.match(
    /(\d+)(\,|\s)/
  );

  if (match) {
    return {
      ...bookData,
      chapter: Number(match[1]),
      verses: cleanVerses(cleanedTitle.replace(match[1], ""))
    };
  }

  // Caso Salmo 95
  const psalmMatch = cleanedTitle.match(/(\d+)/);

  if (psalmMatch) {
    return {
      ...bookData,
      chapter: Number(psalmMatch[1]),
      verses: ""
    };
  }

  return {
    ...bookData,
    chapter: 0,
    verses: ""
  };
}

function cleanVerses(text = "") {
  return text
    .replace(/(\,)/, "")
    .trim()
}