import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promsie: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promsie: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  //If no MONGODB_URI appear/passed throw error
  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI Enviromnet variable inside .env",
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promsie) {
    const opts = {
      bufferCommands: false,
    };

    cached.promsie = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promsie;
  } catch (e) {
    cached.promsie = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
