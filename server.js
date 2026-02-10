import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ type: '*/*' }));

const logDir = path.join(process.cwd(), 'compliance', 'logs');
fs.mkdirSync(logDir, { recursive: true });

function logEvent(event) {
  const date = new Date().toISOString().slice(0, 10);
  const logPath = path.join(logDir, `${date}.md`);
  const entry = `\n## ${new Date().toISOString()}\n\n
**Event:** ${JSON.stringify(event)}\n`;
  fs.appendFileSync(logPath, entry, 'utf8');
}

app.get('/', (req, res) => {
  res.status(200).send('Sentinel listener up');
});

app.post('/helius', (req, res) => {
  logEvent(req.body);
  console.log('Received Helius webhook:', JSON.stringify(req.body));
  res.status(200).json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Sentinel listener running on port ${PORT}`);
});
