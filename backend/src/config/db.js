import mongoose from "mongoose";

export const connectDb = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not defined in environment variables");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
    process.exit(1); // exit with failure.
  }
};
