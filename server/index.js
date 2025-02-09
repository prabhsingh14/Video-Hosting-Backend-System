import dotenv from 'dotenv';

// Load .env file
dotenv.config(); 

import mongoose from 'mongoose';
import connect from './database/connect.js';

// Debugging: Check if MONGODB_URL is loaded
console.log("MONGODB_URL:", process.env.MONGODB_URL);

connect();
