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

  const selection = parseSelections(cleanedTitle);

  // Caso especial: Salmo 95, Sal 117, etc.
  if (
    selection.length === 0 &&
    ["Sal", "Salmo", "Salmos"].includes(bookData.abbreviation)
  ) {
    const match = cleanedTitle.match(/(\d+)/);

    if (match) {
      selection.push({
        chapter: Number(match[1]),
        verses: ""
      });
    }
  }

  return {
    ...bookData,
    selection
  };
}

function parseSelections(text) {

  const selection = [];

  // Formato normal:
  // Jn 3, 16-21
  // Heb 4, 14-16; 5, 7-9

  const regex = /(\d+)\s*,\s*([^;]+)/g;

  let match;

  while ((match = regex.exec(text)) !== null) {

    selection.push({
      chapter: Number(match[1]),
      verses: cleanVerses(match[2])
    });
  }

  if (selection.length > 0) {
    return selection;
  }

  // Formato de salmo:
  // Sal 95

  const psalmMatch = text.match(/(\d+)/);

  if (psalmMatch) {
    selection.push({
      chapter: Number(psalmMatch[1]),
      verses: ""
    });
  }

  return selection;
}

function cleanVerses(text = "") {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.$/, "");
}