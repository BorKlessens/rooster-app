// Script om service worker versie te genereren op basis van build tijd
// Dit zorgt ervoor dat elke build een unieke cache name krijgt

const fs = require('fs');
const path = require('path');

// Genereer een unieke versie op basis van timestamp
const version = Date.now().toString(36);
const swPath = path.join(__dirname, '../public/sw.js');

// Lees het huidige sw.js bestand
let swContent = fs.readFileSync(swPath, 'utf8');

// Vervang de APP_VERSION
swContent = swContent.replace(
  /const APP_VERSION = ['"][^'"]*['"];/,
  `const APP_VERSION = '${version}';`
);

// Schrijf het bestand terug
fs.writeFileSync(swPath, swContent, 'utf8');

console.log(`Service Worker versie geüpdatet naar: ${version}`);



