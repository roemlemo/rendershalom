import axios from "axios";
import * as cheerio from "cheerio";
import dayjs from "dayjs";
import { formatSpanishDate, mexicoNow } from "../utils/date.js";
import { buildReference } from "../utils/getBookAbbreviation.js";

async function getSaint(date) {
  const formattedDate = date.format("MM/DD");
  const url = `https://www.vaticannews.va/es/santos/${formattedDate}.html`;

  const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

  const $ = cheerio.load(data);

  return $(".section__head").first().text().trim();
}

export async function getReadingsAlt(date = mexicoNow()) {
  const formattedDate = date.format("DD-MM-YYYY");
  const url = `https://www.evangelizacion.org.mx/lecturas/primera-lectura/${formattedDate}`;

  const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

  const $ = cheerio.load(data);

  var color = "";
  
  $('#tag-container').find("div").each((i, el) => {
    const text = $(el).text().trim();

    if (text.includes("Color")) {
      color = text.replace("Color: ", "");
    }
  });

  const stringDate = formatSpanishDate(date);

  const title = $('#num-lecturas').text().trim() + ' ' + $('#text-lecturas').text().trim();

  const currentTitle = $('#subtitulo-contenido').text().trim();

  const first_reading = {
    type: "first_reading",
    reference: buildReference(currentTitle),
    title: currentTitle, 
    resp: null,
    text: $('#contenido-principal').html().replace(/(<br[^>]*>\s*){2,}/gi, '\n\n').trim()
  }

  const result = {
    color: color,
    date: stringDate,
    title: title,
    readings: [
      first_reading
    ]
  };

  const links = [];
  $('#acordeon-lecturas').find('.btn-lectura-simple').each((index, element) => {
    const href = $(element).attr('href').replace('#titulo-contenido', '');
    if (href && href != url) {
      links.push(href);
    }
  });

  await Promise.all(links.map(async (item) => {
    const reading = await getReadingContent(item);
    result.readings.push(reading);
  }));

  return result;
}

async function getReadingContent(url) {
  const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

  const $ = cheerio.load(data);

  const currentTitle = $('#titulo-contenido').text().trim();
  const currentSubtitle = $('#subtitulo-contenido').text().trim();

  var type = "";
  var resp = null;

  const content = $('#contenido-principal');
  var text = content.html().replace(/(<br[^>]*>\s*){2,}/gi, '\n\n').trim()

  switch (currentTitle.toLocaleLowerCase()) {
    case "primera lectura":
      type = "first_reading";
      break;
    case "salmo":
      type = "psalm";
      resp = content.find('h5').first().text().replace("R.", "").trim();
      content.find('h5').remove();
      text = content.text().replace(/([\n\r]){2,}R./gi, '\nR.').replace(/([\n\r]){3,}/gi, '\n\n').trim();
      break;
    case "segunda lectura":
      type = "second_reading";
      break;
    default:
      type = "gospel";
      break;
  }

  const reading = {
    type: type,
    reference: buildReference(currentSubtitle),
    title: currentSubtitle, 
    resp: resp,
    text: text
  }

  return reading;
}


async function getContent(date) {
  const formattedDate = date.format("D-M-YYYY");
  const url = date.day() != 0 ? `https://www.dominicos.org/predicacion/evangelio-del-dia/${formattedDate}/`
                                 : `https://www.dominicos.org/predicacion/homilia/${formattedDate}/lecturas/`;

  const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

  return cheerio.load(data);
}

export async function getReadings(date = mexicoNow()) {
  try {
    const $ = await getContent(date);

    const result = {
      date: formatSpanishDate(date),
      title: await getSaint(date),
      readings: []
    };

    let currentSection = null;
    let buffer = "";
    let currentTitle = "";
    let currentReference = null;
    let currentResp = null;

    const $content = date.day() != 0 ? $(".contenido-dia") : $(".contenido-homilia");

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
        } else if (text.toLowerCase().includes("segunda lectura")) {
          currentSection = "second_reading";
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
        buffer += "\n\n" + text;
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
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}