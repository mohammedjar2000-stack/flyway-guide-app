import { Router } from 'express';
import { fetchTurkeyHotelCatalog, proxyGoogleHotelPhoto } from '../turkeyHotels.js';

export const hotelsRouter = Router();

hotelsRouter.get('/turkey', async (req, res) => {
  try {
    const priorityOnly = String(req.query.priority || '') === '1';
    const result = await fetchTurkeyHotelCatalog({ priorityOnly });
    res.json({
      ok: true,
      count: result.hotels.length,
      sources: result.sources,
      hotels: result.hotels,
    });
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? err.message : 'hotel catalog failed',
    });
  }
});

hotelsRouter.get('/photo', async (req, res) => {
  const ref = String(req.query.ref || '').trim();
  if (!ref) {
    res.status(400).json({ error: 'missing photo reference' });
    return;
  }
  try {
    const photo = await proxyGoogleHotelPhoto(ref);
    if (!photo) {
      res.status(404).json({ error: 'photo unavailable' });
      return;
    }
    res.setHeader('Content-Type', photo.contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(photo.body));
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'photo proxy failed' });
  }
});
