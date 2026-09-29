import mongoose from 'mongoose';

export async function connectDB() {
  const uri =
    process.env.MONGO_URI ||
    'mongodb://127.0.0.1:27017/foodbridge';

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
    return true;
  } catch (e) {
    console.warn('MongoDB unavailable:', e.message);
    return false;
  }
}