#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all HTML files in the public directory
const publicDir = path.join(__dirname, '../public');
const htmlFiles = fs.readdirSync(publicDir).filter(file => file.endsWith('.html'));

console.log(`Found ${htmlFiles.length} HTML files to process...`);

let updatedCount = 0;

htmlFiles.forEach(file => {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if favicon is already present
    if (content.includes('faviconolumba.png')) {
        console.log(`✅ ${file} - Already has favicon`);
        return;
    }
    
    // Find the title tag and add favicon after it
    const titleMatch = content.match(/<title>.*?<\/title>/);
    if (titleMatch) {
        const faviconLink = '\n    <link rel="icon" type="image/png" href="/assets/faviconolumba.png">';
        content = content.replace(titleMatch[0], titleMatch[0] + faviconLink);
        
        fs.writeFileSync(filePath, content);
        console.log(`✅ ${file} - Added favicon`);
        updatedCount++;
    } else {
        console.log(`⚠️  ${file} - No title tag found`);
    }
});

console.log(`\n🎉 Updated ${updatedCount} files with favicon!`);
