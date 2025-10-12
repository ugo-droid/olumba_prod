// =============================
// Health Check API
// =============================
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    ok: true,
    timestamp: new Date().toISOString(),
    service: 'olumba-billing',
  });
}

