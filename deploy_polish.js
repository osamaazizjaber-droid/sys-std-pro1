const fs = require('fs');
const path = require('path');

const dir = 'c:\\ring\\ring_Projects\\Workers\\FV\\FINAL\\SYS WMS Pro 12 - Copy\\sys-wms-web';

// --- TASK 1: Anti-Dev Tools Hook ---
const configPath = path.join(dir, 'js', 'config.js');
let configContent = fs.readFileSync(configPath, 'utf-8');
const securityScript = `
// Security Measures: Disable Right-Click and F12 DevTools
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('keydown', event => {
    if (event.code === 'F12') { event.preventDefault(); return false; }
    if (event.ctrlKey && event.shiftKey && (event.code === 'KeyI' || event.code === 'KeyJ')) { event.preventDefault(); return false; }
    if (event.ctrlKey && event.code === 'KeyU') { event.preventDefault(); return false; }
});
`;
if (!configContent.includes("document.addEventListener('contextmenu'")) {
    configContent += '\\n' + securityScript;
    fs.writeFileSync(configPath, configContent);
    console.log('✅ Applied Anti-DevTools Security to config.js');
}

// --- TASK 2: ID Cards Arabic Fonts ---
const idCardsPath = path.join(dir, 'idcards.html');
let idCardsContent = fs.readFileSync(idCardsPath, 'utf-8');
const oldFontImport = /<link href="https:\\/\\/fonts\\.googleapis\\.com\\/css2\\?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet" \\/>/gi;
const oldFontImport2 = /<link href="https:\\/\\/fonts\\.googleapis\\.com\\/css2\\?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" \\/>/gi;

const newFontImport = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Cairo:wght@400;700;800&family=Tajawal:wght@400;700;800&family=Almarai:wght@400;700;800&family=Changa:wght@400;700;800&family=Amiri:wght@400;700&display=swap" rel="stylesheet" />';

if (!idCardsContent.includes('family=Cairo:wght')) {
    idCardsContent = idCardsContent.replace(oldFontImport, newFontImport);
    idCardsContent = idCardsContent.replace(oldFontImport2, newFontImport);
    fs.writeFileSync(idCardsPath, idCardsContent);
    console.log('✅ Applied Arabic Font Engine payload to idcards.html');
}

// --- TASK 3: Dropdown Dark Theme ---
const settingsPath = path.join(dir, 'js', 'settings.js');
let settingsContent = fs.readFileSync(settingsPath, 'utf-8');

const s1 = '<div id="wms-dropdown" style="width:240px; background:#ffffff; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1); border:1px solid #f1f5f9; padding:12px; z-index:9999; font-family:\\'Inter\\', sans-serif;">';
const r1 = '<div id="wms-dropdown" class="bg-surface-container-lowest border border-surface-container" style="width:240px; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.3); padding:12px; z-index:9999; font-family:\\'Inter\\', sans-serif; color:var(--on-surface);">';

const s2 = 'color="#334155"';
const r2 = 'class="text-on-surface hover:text-primary hover:bg-surface-container-low"';

const s3 = 'border-bottom:1px solid #f8fafc;';
const r3 = 'border-bottom:1px solid var(--surface-container-highest);';

const s4 = 'border-top:1px solid #f1f5f9;';
const r4 = 'border-top:1px solid var(--surface-container-highest);';

const s5 = "border:1px solid ${isD==='false'?'#f49000':'#e2e8f0'};";
const r5 = "border:1px solid ${isD==='false'?'#f49000':'var(--outline-variant)'}; background: ${isD==='false'?'var(--primary-container)':'transparent'};";

const s6 = "border:1px solid ${isD==='true'?'#f49000':'#e2e8f0'};";
const r6 = "border:1px solid ${isD==='true'?'#f49000':'var(--outline-variant)'}; background: ${isD==='true'?'var(--primary-container)':'transparent'};";

let m3 = settingsContent;
m3 = m3.replace(s1, r1);
m3 = m3.replaceAll(s2, r2);
m3 = m3.replaceAll(s3, r3);
m3 = m3.replaceAll(s4, r4);
m3 = m3.replace(s5, r5);
m3 = m3.replace(s6, r6);

if (m3 !== settingsContent) {
    fs.writeFileSync(settingsPath, m3);
    console.log('✅ Applied Dark Theme semantics to the Settings Dropdown.');
}

console.log('--- ALL TASKS COMPLETE ---');
