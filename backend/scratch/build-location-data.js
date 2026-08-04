const pincode = require('india-pincode');
const fs = require('fs');
const path = require('path');

const zlib = require('zlib');

async function build() {
  try {
    const pkgPath = require.resolve('india-pincode');
    const parentDir = path.dirname(path.dirname(pkgPath));
    const dataPath = path.join(parentDir, 'data', 'pincodes.json.gz');
    
    if (fs.existsSync(dataPath)) {
        const buffer = fs.readFileSync(dataPath);
        const unzipped = zlib.gunzipSync(buffer);
        const data = JSON.parse(unzipped.toString('utf-8'));
        
        const locationTree = {};
        
        for (const record of data) {
            const state = record.stateName || record.s;
            const district = record.districtName || record.i;
            const taluk = record.taluk || record.v; // using division as taluk
            
            if (state && district && taluk) {
                if (!locationTree[state]) locationTree[state] = {};
                if (!locationTree[state][district]) locationTree[state][district] = new Set();
                locationTree[state][district].add(taluk);
            }
        }
        
        // Convert Sets to Arrays and sort
        const cleanTree = {};
        const allStates = Object.keys(locationTree).sort();
        for (const state of allStates) {
            cleanTree[state] = {};
            const districts = Object.keys(locationTree[state]).sort();
            for (const dist of districts) {
                cleanTree[state][dist] = Array.from(locationTree[state][dist]).sort();
            }
        }
        
        const fileContent = `// Auto-generated comprehensive list of Indian States, Districts, and Taluks (Divisions)
export const locationData: Record<string, Record<string, string[]>> = ${JSON.stringify(cleanTree, null, 2)};

export const INDIA_STATES = Object.keys(locationData).sort();

export function getDistrictsForState(stateName: string): string[] {
  if (!stateName || !locationData[stateName]) return [];
  return Object.keys(locationData[stateName]).sort();
}

export function getTaluksForDistrict(stateName: string, districtName: string): string[] {
  if (!stateName || !districtName || !locationData[stateName]) return [];
  const districtData = locationData[stateName][districtName];
  if (!districtData) return [];
  return [...districtData].sort();
}
`;
        const destPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'lib', 'locationData.ts');
        fs.writeFileSync(destPath, fileContent, 'utf-8');
        console.log("Successfully wrote locationData.ts with", allStates.length, "states to", destPath);
    }
  } catch (err) {
    console.error(err);
  }
}
build();
