import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(): Promise<void> {
  mongoose.connection.on('connected', () => {
    console.log('[db] connected to MongoDB');
  });
  mongoose.connection.on('error', (err) => {
    console.error('[db] connection error:', err.message);
  });

  await mongoose.connect(env.mongodbUri);
}
