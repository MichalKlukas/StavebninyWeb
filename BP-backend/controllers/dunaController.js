// controllers/dunaController.js
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Konfigurace připojení k databázi
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

// Test připojení
exports.getStatus = (req, res) => {
  try {
    // Zde můžete přidat ověření připojení k databázi
    res.json({
      state: 1,
      message: "Server běží, databáze odpovídá."
    });
  } catch (error) {
    console.error('Chyba při kontrole stavu:', error);
    res.json({
      state: 0,
      message: `Nastala následující chyba: ${error.message}`
    });
  }
};

// Import produktů
exports.importProducts = async (req, res) => {
  try {
    // Kontrola, zda byl nahrán soubor
    if (!req.file) {
      return res.status(400).json({
        state: 0,
        message: "Import se nezdařil.",
        detail: "Nebyl nahrán žádný soubor."
      });
    }

    console.log('Zpracovávám soubor:', req.file.originalname);
    
    // Vytvoření instance AdmZip pro práci se ZIP souborem
    const zip = new AdmZip(req.file.buffer);
    const zipEntries = zip.getEntries();
    
    console.log(`ZIP soubor obsahuje ${zipEntries.length} položek`);
    
    // Pole pro ukládání zpracovaných dat
    const processedData = {};
    
    // Procházení všech souborů v ZIP archivu
    for (const entry of zipEntries) {
      if (!entry.isDirectory) {
        try {
          // Extrakce a parsování JSON souboru
          const content = entry.getData().toString('utf8');
          const data = JSON.parse(content);
          
          console.log(`Zpracovávám soubor: ${entry.name}`);
          if (data.appinfo) {
            console.log(`Verze aplikace: ${data.appinfo.version}, Produkt: ${data.appinfo.product}`);
          }
          
          // Uložení dat podle typu souboru
          const fileName = entry.name.toLowerCase();
          if (fileName.includes('product')) {
            processedData.products = data.products || [];
            console.log(`Načteno ${processedData.products.length} produktů`);
            // Výpis prvních 2 produktů pro ukázku
            if (processedData.products.length > 0) {
              console.log('Ukázka produktů:');
              console.log(JSON.stringify(processedData.products.slice(0, 2), null, 2));
            }
          } else if (fileName.includes('categor')) {
            processedData.categories = data.categories || [];
            console.log(`Načteno ${processedData.categories.length} kategorií`);
            // Výpis první kategorie pro ukázku
            if (processedData.categories.length > 0) {
              console.log('Ukázka kategorií:');
              console.log(JSON.stringify(processedData.categories[0], null, 2));
            }
          } else {
            console.log(`Soubor ${entry.name} má neznámý typ obsahu`);
            processedData[fileName] = data;
          }
          
          // TODO: Implementace logiky pro uložení dat do databáze
          // Zde by byl kód pro uložení dat do PostgreSQL
          
        } catch (error) {
          console.error(`Chyba při zpracování souboru ${entry.name}:`, error);
        }
      }
    }
    
    // Odpověď s úspěchem
    return res.json({
      state: 1, 
      message: "Byl proveden úspěšný import.",
      detail: `Zpracováno ${Object.keys(processedData).length} typů dat.`,
      summary: {
        products: processedData.products ? processedData.products.length : 0,
        categories: processedData.categories ? processedData.categories.length : 0
      }
    });
    
  } catch (error) {
    console.error('Chyba při importu:', error);
    return res.json({
      state: 0,
      message: "Import se nezdařil.",
      detail: error.message
    });
  }
};

// Placeholder pro ostatní metody
exports.updateStockItem = (req, res) => {
  res.status(501).json({ message: 'Endpoint bude implementován' });
};

exports.getOrders = (req, res) => {
  res.status(501).json({ message: 'Endpoint bude implementován' });
};

exports.getDocuments = (req, res) => {
  res.status(501).json({ message: 'Endpoint bude implementován' });
};