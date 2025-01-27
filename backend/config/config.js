import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// API Keys
export const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
if (!DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY environment variable is not set");
}

// Database Configuration
export const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://mongodb:27017';
export const DATABASE_NAME = process.env.DATABASE_NAME || 'dna_analysis'; 