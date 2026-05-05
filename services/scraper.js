import axios from "axios";
import cheerio from "cheerio";
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

    $("h2, h3").each((i, el) => {
      const title = $(el).text().toLowerCase();
      const content = $(el).nextUntil("h2, h3").text().trim();

      if (title.includes("primera lectura")) {
        result.readings.push({
          type: "first_reading",
          title: "Primera lectura",
          text: cleanText(content)
        });
      }

      if (title.includes("salmo")) {
        result.readings.push({
          type: "psalm",
          title: "Salmo responsorial",
          text: cleanText(content)
        });
      }

      if (title.includes("evangelio")) {
        result.readings.push({
          type: "gospel",
          title: "Evangelio",
          text: cleanText(content)
        });
      }
    });

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