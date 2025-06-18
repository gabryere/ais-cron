import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const mmsiList = [
  "247086200", "247057100", "247186700", // Tirrenia
  "247482700", "247015400", "247484300", "247185400", "247132400", "247034200", // Moby
  "247415200", "247273800", "247286700", // Grimaldi
  "247136000", "247362600", "247106500" // GNV
];

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

async function fetchShipData(mmsi) {
  return new Promise((resolve) => {
    const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
    const timeout = setTimeout(() => {
      ws.terminate();
      resolve(null);
    }, 5000); // max 5 sec per mmsi

    ws.on('open', () => {
      const sub = {
        APIKey: process.env.AIS_API_KEY,
        BoundingBoxes: [[[35, 5], [46, 20]]],
        FiltersShipMMSI: [mmsi],
        FilterMessageTypes: ['PositionReport']
      };
      ws.send(JSON.stringify(sub));
    });

    ws.on('message', (msg) => {
      const data = JSON.parse(msg);
      if (data.MessageType === 'PositionReport') {
        const meta = data.MetaData;
        const report = data.Message.PositionReport;
        if (meta && meta.MMSI.toString() === mmsi) {
          clearTimeout(timeout);
          ws.terminate();
          resolve({
            mmsi,
            latitude: meta.latitude,
            longitude: meta.longitude,
            speed: report.Sog,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    ws.on('error', () => resolve(null));
  });
}

async function saveToSupabase(record) {
  if (!record) return;
  const { error } = await supabase.from('position').insert(record);
  if (error) console.error(`Errore supabase per MMSI ${record.mmsi}:`, error.message);
}

async function runCron() {
  for (const mmsi of mmsiList) {
    const data = await fetchShipData(mmsi);
    await saveToSupabase(data);
  }
  console.log(`[${new Date().toISOString()}] Tutti i dati salvati`);
}

runCron();
