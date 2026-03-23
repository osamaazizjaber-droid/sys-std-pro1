const fs = require('fs');
const path = require('path');

const dir = 'c:\\ring\\ring_Projects\\Workers\\FV\\FINAL\\SYS WMS Pro 12 - Copy\\sys-wms-web';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf-8');
    let original = content;

    // Titles
    content = content.replace(/<title>.*Forge.*<\/title>/gi, '<title>SYS WMS Pro</title>');
    
    // Brand names
    content = content.replace(/Forge Admin - Approvals/g, 'SYS WMS Pro');
    content = content.replace(/Forge Industrial WMS - Portal/g, 'SYS WMS Pro');
    content = content.replace(/Forge Industrial WMS - Dashboard/g, 'SYS WMS Pro');
    content = content.replace(/Forge Industrial WMS/g, 'SYS WMS Pro');
    content = content.replace(/Forge WMS/g, 'SYS WMS Pro');

    // Logo size boost: change h-8 to h-12 where src matches logo.png
    content = content.replace(/src="https:\/\/ormjypixacnedlmqrxfq.supabase.co\/storage\/v1\/object\/public\/SYS%20WMS%20Pro\/logo\/logo.png"[^>]*?class="[^"]*?h-8([^"]*?)"/g, (match) => {
        return match.replace(/h-8/, 'h-12 w-auto object-contain');
    });

    if(content !== original) {
        fs.writeFileSync(path.join(dir, file), content, 'utf-8');
        console.log('Fixed:', file);
    }
});
