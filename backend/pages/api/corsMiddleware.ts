// pages/api/corsMiddleware.ts

import Cors from 'cors';
import type { NextApiRequest, NextApiResponse } from 'next';

// Allowed origins
const allowedOrigins = ['https://oddsly.vercel.app', 'https://oddsly-backend-three.vercel.app', 'http://localhost:5173', 'http://127.0.0.1:5173'];

// Initialize the cors middleware
const cors = Cors({
  methods: ['GET', 'HEAD', 'POST', 'OPTIONS', 'PUT'],
  origin: function (origin, callback) {
    console.log('Request origin:', origin);
    console.log('Allowed origins:', allowedOrigins);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
});

// Helper method to wait for middleware to execute before continuing
export function runCorsMiddleware(req: NextApiRequest, res: NextApiResponse) {
  return new Promise<void>((resolve, reject) => {
    cors(req, res, (result: unknown) => {
      if (result instanceof Error) {
        console.error('CORS error:', result);
        return reject(result);
      }
      return resolve();
    });
  });
}
