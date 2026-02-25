import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Replicate from 'replicate';

if (!process.env.REPLICATE_API_KEY) {
  console.error('Missing REPLICATE_API_KEY — create a .env file with your key');
  process.exit(1);
}

const app = express();
const replicate = new Replicate({ auth: process.env.REPLICATE_API_KEY });

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Start an async prediction — returns prediction ID immediately
app.post('/api/transcribe', async (req, res) => {
  const { video } = req.body;
  if (!video) {
    return res.status(400).json({ error: 'No video data provided' });
  }

  try {
    const prediction = await replicate.predictions.create({
      model: 'basord/lip-reading-ai-vsr',
      input: { video },
    });
    res.json({ id: prediction.id, status: prediction.status });
  } catch (err) {
    console.error('Replicate create error:', err);
    res.status(500).json({ error: 'Failed to start transcription' });
  }
});

// Poll a prediction by ID
app.get('/api/prediction/:id', async (req, res) => {
  try {
    const prediction = await replicate.predictions.get(req.params.id);

    if (prediction.status === 'succeeded') {
      res.json({ status: 'succeeded', transcript: prediction.output });
    } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
      res.json({ status: 'failed' });
    } else {
      res.json({ status: prediction.status });
    }
  } catch (err) {
    console.error('Replicate poll error:', err);
    res.status(500).json({ error: 'Failed to check prediction' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server ready on http://localhost:${PORT}`);
});
