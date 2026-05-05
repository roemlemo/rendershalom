import axios from "axios";
import * as cheerio from "cheerio";
import dayjs from "dayjs";

export async function getReadings(date = dayjs()) {
  const formattedDate = date.format("D-M-YYYY"); // 👈 formato clave
  const url = `https://www.dominicos.org/predicacion/evangelio-del-dia/${formattedDate}/`;

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const $ = cheerio.load(data);

    const result = {
      date: date.format("YYYY-MM-DD"),
      title: $("h1").first().text().trim(),
      readings: []
    };

    let currentSection = null;
    let buffer = "";

    $("h2, h3, p").each((i, el) => {
      const tag = el.tagName;
      const text = $(el).text().trim();

      if (!text) return;

      // Detectar secciones
      if (tag === "h2") {
        if (buffer && currentSection) {
          pushReading(result, currentSection, buffer);
        }

        buffer = "";

        if (text.toLowerCase().includes("primera lectura")) {
          currentSection = "first_reading";
        } else if (text.toLowerCase().includes("salmo")) {
          currentSection = "psalm";
        } else if (text.toLowerCase().includes("evangelio")) {
          currentSection = "gospel";
        } else {
          currentSection = null;
        }

        return;
      }

      // Acumular contenido
      if (currentSection) {
        buffer += " " + text;
      }
    });

    // último bloque
    if (buffer && currentSection) {
      pushReading(result, currentSection, buffer);
    }

    return result;

  } catch (error) {
    console.error("Error scraping:", error.message);
    throw new Error("No se pudieron obtener las lecturas");
  }
}

function pushReading(result, type, text) {
  const titles = {
    first_reading: "Primera lectura",
    psalm: "Salmo responsorial",
    gospel: "Evangelio"
  };

  result.readings.push({
    type,
    title: titles[type],
    text: cleanText(text)
  });
}

function cleanText(text) {
  return text
    .replace(/\s+/g, " ")
    .trim();
}