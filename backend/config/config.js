import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// API Keys
export const DEEPSEEK_API_KEY = "sk-4ff47d34c52948edab6c9d0e7745b75b";

// File Upload Configuration
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['text/plain', 'text/csv', 'application/json', 'application/vnd.ms-excel', 'image/jpeg', 'image/png', 'image/gif']; 