import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { createApp } from './app';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dialysis';
const PORT = Number(process.env.API_PORT || 4000);

async function start() {
  await mongoose.connect(MONGODB_URI);
  console.log('✓ Connected to MongoDB');

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`✓ API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
