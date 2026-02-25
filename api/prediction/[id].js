import Replicate from 'replicate';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_KEY });

export const config = { maxDuration: 15 };

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing prediction id' });
  }

  try {
    const prediction = await replicate.predictions.get(id);

    if (prediction.status === 'succeeded') {
      res.json({ status: 'succeeded', transcript: prediction.output });
    } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
      res.json({ status: 'failed' });
    } else {
      // still processing
      res.json({ status: prediction.status });
    }
  } catch (err) {
    console.error('Replicate poll error:', err);
    res.status(500).json({ error: 'Failed to check prediction' });
  }
}
