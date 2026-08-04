const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'frontend', 'src', 'lib', 'locationData.ts');
let content = fs.readFileSync(filePath, 'utf-8');

const prefix = 'export const locationData: Record<string, Record<string, string[]>> = ';
const suffix = ';\n\nexport const INDIA_STATES';

const startIndex = content.indexOf(prefix) + prefix.length;
const endIndex = content.indexOf(suffix);

let jsonStr = content.substring(startIndex, endIndex);
let locationData = JSON.parse(jsonStr);

locationData['LADAKH'] = {
  "KARGIL": ["Kargil Division"],
  "LEH": ["Leh Division"],
  "NUBRA": [],
  "SHAM": [],
  "CHANGTHANG": [],
  "ZANSKAR": [],
  "DRASS": []
};

const newJsonStr = JSON.stringify(locationData, null, 2);
const newContent = content.substring(0, startIndex) + newJsonStr + content.substring(endIndex);

fs.writeFileSync(filePath, newContent, 'utf-8');
console.log('Successfully updated LADAKH in locationData.ts');


