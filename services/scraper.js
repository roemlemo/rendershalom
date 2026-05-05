import axios from "axios";
import * as cheerio from "cheerio";
import dayjs from "dayjs";

export async function getReadings(date = dayjs()) {
  const formattedDate = date.format("YYYY-MM-DD");
  const url = `https://evangeliodeldia.org/${formattedDate}/`;

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const $ = cheerio.load(data);

    const result = {
      date: formattedDate,
      title: $("h1").first().text().trim(),
      readings: []
    };

    // 🔥 Buscar todo el contenido principal
    const content = $("article, .post, .entry-content").text();

    // 📖 Primera lectura
    const firstReadingMatch = content.match(/Primera lectura([\s\S]*?)Salmo/i);

    if (firstReadingMatch) {
      result.readings.push({
        type: "first_reading",
        title: "Primera lectura",
        text: cleanText(firstReadingMatch[1])
      });
    }

    // 🎵 Salmo
    const psalmMatch = content.match(/Salmo([\s\S]*?)Evangelio/i);

    if (psalmMatch) {
      result.readings.push({
        type: "psalm",
        title: "Salmo responsorial",
        text: cleanText(psalmMatch[1])
      });
    }

    // ✝️ Evangelio
    const gospelMatch = content.match(/Evangelio([\s\S]*)/i);

    if (gospelMatch) {
      result.readings.push({
        type: "gospel",
        title: "Evangelio",
        text: cleanText(gospelMatch[1])
      });
    }

    return result;

  } catch (error) {
    console.error("Error scraping:", error.message);
    throw new Error("No se pudieron obtener las lecturas");
  }
}

function cleanText(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n/g, " ")
    .trim();
}