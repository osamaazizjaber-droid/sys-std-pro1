const fs = require('fs');
const path = require('path');

const dir = 'c:\\ring\\ring_Projects\\Workers\\FV\\FINAL\\SYS WMS Pro 12 - Copy\\sys-wms-web';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf-8');
    let original = content;

    // The logo class in the dashboard headers is exactly: class="h-10 w-auto object-contain"
    // We will scale it up significantly to counteract the deep transparent padding
    content = content.replace(/class="h-10 w-auto object-contain"/g, 'class="h-16 sm:h-20 w-auto object-contain drop-shadow-md scale-110"');

    // Also catch any instances where it was changed to 'h-12 w-auto object-contain' by accident earlier
    content = content.replace(/class="h-12 w-auto object-contain"/g, 'class="h-16 sm:h-20 w-auto object-contain drop-shadow-md scale-110"');

    if(content !== original) {
        fs.writeFileSync(path.join(dir, file), content, 'utf-8');
        console.log('Scaled up logo in:', file);
    }
});
