import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import "dayjs/locale/es.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

export function mexicoNow() {
  return dayjs().tz("America/Mexico_City");
}

function capitalize(text = "") {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatSpanishDate(date) {
    const array = date.format("dddd D-MMMM-YYYY").split("-");

    return capitalize(array[0]) + " de " + capitalize(array[1]) + " de " + array[2];
}