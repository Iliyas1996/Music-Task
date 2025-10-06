const express = require('express');
const path = require('path');
const fs = require('fs');
const seedrandom = require('seedrandom');
const { faker } = require('@faker-js/faker');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const LOCALES_DIR = path.join(__dirname, 'locales');
const LOCALES = {};
for (const f of fs.readdirSync(LOCALES_DIR)) {
  if (f.endsWith('.json')) {
    const code = path.basename(f, '.json');
    try {
      LOCALES[code] = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, f), 'utf8'));
    } catch (e) {}
  }
}

function rngFor(seed) {
  return seedrandom(seed);
}

function combineSeedWithPage(seed, page) {
  return `${seed}::page=${page}`;
}

function pick(rng, arr) {
  if (!arr || arr.length === 0) return '';
  return arr[Math.floor(rng() * arr.length)];
}

function capitalizeWords(s) {
  return (s || '').replace(/\b\w/g, c => c.toUpperCase());
}

function escapeXml(unsafe) {
  return (unsafe || '').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
}

function biasedInt(rng, n) {
  const f = Math.floor(n);
  const frac = n - f;
  if (rng() < frac) return f + 1;
  return f;
}

function generateSong(localeCode, globalSeed, index) {
  const locale = LOCALES[localeCode];
  const seedStr = `${globalSeed}::item=${index}`;
  const rng = rngFor(seedStr);

  const titleTemplates = locale.titleTemplates || ['{adj} {noun}', '{noun} of {noun2}', '{verb} {noun}'];
  const t = pick(rng, titleTemplates);
  const adj = pick(rng, locale.adjectives);
  const noun = pick(rng, locale.nouns);
  const noun2 = pick(rng, locale.nouns);
  const verb = pick(rng, locale.verbs);
  const title = capitalizeWords(t.replace('{adj}', adj).replace('{noun}', noun).replace('{noun2}', noun2).replace('{verb}', verb));

  const artistKind = rng() < 0.5 ? 'personal' : 'band';
  let artist = '';
  if (artistKind === 'personal') {
    try {
      faker.locale = locale.fakerLocale || 'en';
      artist = `${faker.person.firstName()} ${faker.person.lastName()}`;
    } catch {
      artist = `${pick(rng, locale.firstNames)} ${pick(rng, locale.lastNames)}`;
    }
  } else {
    artist = `${pick(rng, locale.bandPrefixes)} ${pick(rng, locale.bandNouns)}`;
  }

  const album = rng() < 0.4 ? 'Single' : capitalizeWords(`${pick(rng, locale.albumAdjectives)} ${pick(rng, locale.albumNouns)}`);
  const genre = pick(rng, locale.genres);

  const likesAvg = locale.likesAvg || 100;
  const likes = biasedInt(rng, likesAvg * rng() * 2);

  const bgh = Math.floor(rng() * 360);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'>
    <defs>
      <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
        <stop offset='0' stop-color='hsl(${bgh} 70% 60%)'/>
        <stop offset='1' stop-color='hsl(${(bgh+60)%360} 70% 45%)'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <text x='50%' y='60%' font-family='Arial' font-size='20' fill='white' text-anchor='middle'>${escapeXml(title)}</text>
    <text x='50%' y='80%' font-family='Arial' font-size='14' fill='white' text-anchor='middle'>${escapeXml(artist)}</text>
  </svg>`;
  const coverDataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);

  const audioUrl = `/api/preview?seed=${encodeURIComponent(globalSeed)}&index=${index}&locale=${encodeURIComponent(localeCode)}`;

  return { index, title, artist, album, genre, likes, cover: coverDataUrl, audioUrl };
}

app.get('/api/songs', (req, res) => {
  const locale = req.query.locale || Object.keys(LOCALES)[0];
  const seed = req.query.seed || 'default-seed-0000';
  const page = parseInt(req.query.page || '1', 10);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '12', 10)));
  if (!LOCALES[locale]) return res.status(400).json({ error: 'Unknown locale' });
  const pageSeed = combineSeedWithPage(seed, page);
  const songs = [];
  const baseIndex = (page - 1) * pageSize + 1;
  for (let i = 0; i < pageSize; i++) songs.push(generateSong(locale, pageSeed, baseIndex + i));
  res.json({ page, pageSize, locale, seed, songs });
});

app.get('/api/preview', (req, res) => {
  const seed = req.query.seed || 'default-seed-0000';
  const index = parseInt(req.query.index || '1', 10);
  const locale = req.query.locale || Object.keys(LOCALES)[0];
  const rng = rngFor(`${seed}::audio::${index}::${locale}`);
  const sampleRate = 44100;
  const durationSeconds = 6;
  const numSamples = sampleRate * durationSeconds;
  const baseFreq = 220 + Math.floor(rng() * 300);
  const bpm = 60 + Math.floor(rng() * 100);
  const beats = Math.max(4, Math.floor((bpm * durationSeconds) / 60));
  const scale = [0,2,4,5,7,9,11];
  const notes = [];
  for (let b = 0; b < beats; b++) {
    const degree = scale[Math.floor(rng() * scale.length)];
    const octave = 3 + Math.floor(rng() * 2);
    const semitone = degree + octave*12;
    const freq = 440 * Math.pow(2, (semitone - 69)/12);
    notes.push({start: Math.floor(b * (sampleRate * 60 / bpm)), durSamples: Math.floor(sampleRate * (60/bpm)), freq});
  }
  const buffer = new Float32Array(numSamples);
  for (const n of notes) {
    for (let i = 0; i < n.durSamples; i++) {
      const idx = Math.floor(n.start) + i;
      if (idx >= numSamples) break;
      const s = Math.sin(2*Math.PI*n.freq*(i/sampleRate)) * 0.6 + 0.25*Math.sin(2*Math.PI*(n.freq*2)*(i/sampleRate));
      const env = Math.min(1, i / (sampleRate*0.02)) * (1 - (i / n.durSamples));
      buffer[idx] += s * env * 0.6;
    }
  }
  let max = 0;
  for (let i=0;i<buffer.length;i++) if (Math.abs(buffer[i])>max) max=Math.abs(buffer[i]);
  if (max > 1) for (let i=0;i<buffer.length;i++) buffer[i]/=max;
  const wavBuffer = encodeWAV(buffer, sampleRate);
  res.setHeader('Content-Type', 'audio/wav');
  res.setHeader('Content-Length', wavBuffer.length);
  res.send(wavBuffer);
});

function encodeWAV(float32Array, sampleRate) {
  const buffer = Buffer.alloc(44 + float32Array.length * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + float32Array.length * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(float32Array.length * 2, 40);
  let offset = 44;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    s = Math.round(s * 32767);
    buffer.writeInt16LE(s, offset);
  }
  return buffer;
}

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

