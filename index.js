import express from "express";
import dayjs from "dayjs";
import { getReadings } from "./services/scraper.js";
import { prayers } from "./utils/prayers.js";
import { prayersContent } from "./utils/prayersContent.js";
import fs from "fs"; 

const app = express();
const PORT = process.env.PORT || 3000;

// Endpoint: hoy
app.get("/readings/today", async (req, res) => {
  try {
    const data = await getReadings(dayjs());
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: por fecha
app.get("/readings/:date", async (req, res) => {
  try {
    const date = dayjs(req.params.date);
    const data = await getReadings(date);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/prayers/all", async (req, res) => {
  try {
    res.json(prayers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/prayers/content/:id", async (req, res) => {
  try {
    res.json(prayersContent[req.params.id]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/metadata", async (req, res) => {
  try {
    const data = fs.readFileSync(
      `./metadata/versions.json`,
      "utf-8"
    );

    res.json(JSON.parse(data));
  } catch {
    res.status(404).json({
      error: 'Metadata not found'
    });
  }
});

app.get("/", (req, res) => {
  res.send("Catholic API running 🚀");
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});