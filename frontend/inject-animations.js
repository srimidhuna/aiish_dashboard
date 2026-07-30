import fs from 'fs';
import path from 'path';

const filesToAnimate = [
  'src/features/dashboard/DashboardPage.tsx',
  'src/features/children/ChildrenPage.tsx',
  'src/features/children/RegisterChildPage.tsx',
  'src/features/children/ChildDetailsPage.tsx',
  'src/features/screenings/ScreeningFormPage.tsx',
  'src/features/hospitals/HospitalsPage.tsx',
  'src/features/profile/ProfilePage.tsx'
];

filesToAnimate.forEach(file => {
  const p = path.join(process.cwd(), file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf-8');
    // Find the first <div className="..."> after return (
    content = content.replace(/return \(\s*<div className="([^"]+)"/g, 'return (\n    <div className="$1 animate-in fade-in duration-300"');
    fs.writeFileSync(p, content);
  }
});
console.log("Animations injected.");
