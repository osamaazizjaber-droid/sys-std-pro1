const fs = require('fs');
const path = require('path');

const dir = 'c:\\ring\\ring_Projects\\Workers\\FV\\FINAL\\SYS WMS Pro 12 - Copy\\sys-wms-web';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf-8');
    let original = content;

    // Use regex to catch all forms of the favicon link that point to the wide logo in Supabase
    const regex = /<link[^>]*rel=["'](shortcut )?icon["'][^>]*href=["']https:\/\/ormjypixacnedlmqrxfq\.supabase\.co\/storage\/v1\/object\/public\/SYS%20WMS%20Pro\/logo\/logo\.png["'][^>]*>/gi;
    
    content = content.replace(regex, '<link rel="icon" href="logo.ico" />');

    if(content !== original) {
        fs.writeFileSync(path.join(dir, file), content, 'utf-8');
        console.log('Favicon Fixed:', file);
    }
});
