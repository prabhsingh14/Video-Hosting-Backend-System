import dotenv from 'dotenv';
import {app} from './app.js';

// Load .env file
dotenv.config(); 

import mongoose from 'mongoose';
import connect from './database/connect.js';

// Debugging: Check if MONGODB_URL is loaded
console.log("MONGODB_URL:", process.env.MONGODB_URL);

connect()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT || 8000}`);
    });
})
.catch(error => console.error("Database connection error:", error));