import axios from "axios";
import * as cheerio from "cheerio";
import dayjs from "dayjs";
import { buildReference } from "../utils/getBookAbbreviation.js"; 

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
    let currentReference = null;
    let currentResp = null;

    const $content = $(".contenido-dia");

    // eliminar divs no deseados
    $content.find("div").remove();

    $content.find("h2, p").each((i, el) => {
      const tag = el.tagName;
      const text = $(el).text().trim();

      if (!text) return;

      // Detectar secciones
      if (tag === "h2") {
        if (buffer && currentSection) {
          pushReading(result, currentSection, currentReference, currentTitle, currentResp, buffer);
        }

        buffer = "";
        currentTitle = "";
        currentReference = null;
        currentResp = null;

        if (text.toLowerCase().includes("primera lectura")) {
          currentSection = "first_reading";
        } else if (text.toLowerCase().includes("salmo")) {
          currentSection = "psalm";
        } else if (text.toLowerCase().includes("evangelio del")) {
          currentSection = "gospel";
        } else {
          currentSection = null;
        }

        // Obtener h3 siguiente
        if (currentSection) {
          const nextH3 = $(el).nextAll("h3").first();

          if (nextH3.length) {
            const trimmedText = nextH3.text().trim();
            let resp = null;
            if (currentSection === "psalm") {
              const array = trimmedText.split("R/.");
              currentTitle = array[0].trim();
              if (array.length > 1) {
                resp = array[1].trim();
              }
            } else {
              currentTitle = trimmedText;
            }
            
            currentReference = buildReference(currentTitle);
            currentResp = resp;
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
      pushReading(result, currentSection, currentReference, currentTitle, currentResp, buffer);
    }

    return result;

  } catch (error) {
    console.error("Error scraping:", error.message);
    throw new Error("No se pudieron obtener las lecturas");
  }
}

function pushReading(result, type, reference, title, resp, text) {
  result.readings.push({
    type,
    reference: reference,
    title: title,
    resp: resp,
    text: cleanText(text)
  });
}

function cleanText(text) {
  return text
    .replace(/\s+/g, " ")
    .trim();
}