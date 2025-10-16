import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DATABASE_PATH || join(__dirname, '../../data/olumba.db');
const dbDir = dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

let SQL;
let db;

// Initialize SQL.js
async function initDatabase() {
    SQL = await initSqlJs();
    
    // Try to load existing database
    if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }
}

// Save database to file
function saveDatabase() {
    if (!db) return;
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
}

// Initialize schema
export async function initializeDatabase() {
    await initDatabase();
    
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    db.exec(schema);
    saveDatabase();
    
    console.log('✅ Database initialized successfully');
}

// Database helper functions
export const dbHelpers = {
    // Run a query that doesn't return rows
    run(sql, params = []) {
        if (!db) throw new Error('Database not initialized');
        
        try {
            const stmt = db.prepare(sql);
            if (params.length > 0) {
                stmt.bind(params);
            }
            stmt.step();
            stmt.free();
            saveDatabase();
            return { changes: 1 };
        } catch (error) {
            console.error('SQL Error:', error.message);
            console.error('SQL:', sql);
            console.error('Params:', params);
            throw error;
        }
    },
    
    // Get a single row
    get(sql, params = []) {
        if (!db) throw new Error('Database not initialized');
        
        try {
            const stmt = db.prepare(sql);
            if (params.length > 0) {
                stmt.bind(params);
            }
            const result = stmt.step() ? stmt.getAsObject() : null;
            stmt.free();
            return result;
        } catch (error) {
            console.error('SQL Error:', error.message);
            console.error('SQL:', sql);
            console.error('Params:', params);
            throw error;
        }
    },
    
    // Get all rows
    all(sql, params = []) {
        if (!db) throw new Error('Database not initialized');
        
        try {
            const stmt = db.prepare(sql);
            if (params.length > 0) {
                stmt.bind(params);
            }
            
            const results = [];
            while (stmt.step()) {
                results.push(stmt.getAsObject());
            }
            stmt.free();
            return results;
        } catch (error) {
            console.error('SQL Error:', error.message);
            console.error('SQL:', sql);
            console.error('Params:', params);
            throw error;
        }
    },
    
    // Prepared statement
    prepare(sql) {
        if (!db) throw new Error('Database not initialized');
        return {
            run: (...params) => dbHelpers.run(sql, params),
            get: (...params) => dbHelpers.get(sql, params),
            all: (...params) => dbHelpers.all(sql, params)
        };
    }
};

export default {
    init: initDatabase,
    save: saveDatabase
};