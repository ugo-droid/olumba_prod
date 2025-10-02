import dotenv from 'dotenv';
import { initializeDatabase } from '../database/db.js';

// Load environment variables
dotenv.config();

console.log('🔧 Initializing Olumba database...');

try {
    initializeDatabase();
    console.log('✅ Database initialization complete!');
    process.exit(0);
} catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
}
