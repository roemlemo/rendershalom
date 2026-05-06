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
    let currentTitle = "";

    const $content = $(".contenido-dia");

    // eliminar divs no deseados
    $content.find("div").remove();

    $content.find("h2, h3, p").each((i, el) => {
      const tag = el.tagName;
      const text = $(el).text().trim();

      if (!text) return;

      // Detectar secciones
      if (tag === "h2") {
        if (buffer && currentSection) {
          pushReading(result, currentSection, currentTitle, buffer);
        }

        buffer = "";
        currentTitle = "";

        if (text.toLowerCase().includes("primera lectura")) {
          currentSection = "first_reading";
        } else if (text.toLowerCase().includes("salmo")) {
          currentSection = "psalm";
        } else if (text.toLowerCase().includes("evangelio del")) {
          currentSection = "gospel";
        } else {
          currentSection = null;
        }

        // 🔥 obtener h3 siguiente
        if (currentSection) {
          const nextH3 = $(el).nextAll("h3").first();

          if (nextH3.length) {
            currentTitle = nextH3.text().trim();
          }
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

function pushReading(result, type, title, text) {
  result.readings.push({
    type,
    title: title,
    text: cleanText(text)
  });
}

function cleanText(text) {
  return text
    .replace(/\s+/g, " ")
    .trim();
}