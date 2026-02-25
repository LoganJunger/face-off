import Replicate from 'replicate';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_KEY });

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { video } = req.body;

    if (!video) {
      return res.status(400).json({ error: 'No video data provided' });
    }

    // Create an async prediction instead of blocking with replicate.run()
    const prediction = await replicate.predictions.create({
      model: 'basord/lip-reading-ai-vsr',
      input: { video },
    });

    res.json({ id: prediction.id, status: prediction.status });
  } catch (err) {
    console.error('Replicate create error:', err);
    res.status(500).json({ error: 'Failed to start transcription' });
  }
}
