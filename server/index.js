import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import Replicate from 'replicate';
import { readFile, unlink } from 'fs/promises';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

app.post('/api/transcribe', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  try {
    const fileData = await readFile(req.file.path);
    const base64 = fileData.toString('base64');
    const mimeType = req.file.mimetype || 'video/webm';
    const dataUri = `data:${mimeType};base64,${base64}`;

    const output = await replicate.run('basord/lip-reading-ai-vsr', {
      input: {
        video: dataUri,
      },
    });

    await unlink(req.file.path).catch(() => {});

    res.json({ transcript: output });
  } catch (err) {
    await unlink(req.file.path).catch(() => {});
    console.error('Replicate error:', err);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

if (!process.env.REPLICATE_API_KEY) {
  console.error('Missing REPLICATE_API_KEY — create a .env file with your key');
  process.exit(1);
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server ready on http://localhost:${PORT}`);
});
