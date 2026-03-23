const fs = require('fs');
const path = require('path');

const dir = 'c:\\ring\\ring_Projects\\Workers\\FV\\FINAL\\SYS WMS Pro 12 - Copy\\sys-wms-web';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf-8');
    let original = content;

    content = content.replace(/<link rel="icon" href="logo\.ico" \/>/gi, '<link rel="icon" type="image/png" href="https://ormjypixacnedlmqrxfq.supabase.co/storage/v1/object/public/SYS%20WMS%20Pro/logo/logo.png" />');

    if(content !== original) {
        fs.writeFileSync(path.join(dir, file), content, 'utf-8');
        console.log('Reverted Favicon:', file);
    }
});
