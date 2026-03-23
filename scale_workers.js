const fs = require('fs');
const path = require('path');

const dir = 'c:\\ring\\ring_Projects\\Workers\\FV\\FINAL\\SYS WMS Pro 12 - Copy\\sys-wms-web';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf-8');
    let original = content;

    // Fix the parent container for standard internal views
    const containerRegex = /<div class="h-10 w-auto flex items-center">(\s*)<img(.*?)SYS WMS Pro Logo(.*?)class="(.*?)"/gi;
    
    content = content.replace(containerRegex, (match, p1, p2, p3, p4) => {
        // Change h-10 to h-16
        // Append scale-125 to the image to counteract intrinsic picture padding
        return `<div class="h-16 w-auto flex items-center">${p1}<img${p2}SYS WMS Pro Logo${p3}class="${p4} scale-[1.3] origin-left"`;
    });

    // Also update existing h-16 or h-20 tags that don't have scale
    const directImgRegex = /<img alt="SYS WMS Pro Logo" class="h-16 sm:h-20 w-auto object-contain drop-shadow-md scale-110"/gi;
    content = content.replace(directImgRegex, '<img alt="SYS WMS Pro Logo" class="h-16 sm:h-20 w-auto object-contain drop-shadow-md scale-[1.3] origin-left"');

    if (content !== original) {
        fs.writeFileSync(path.join(dir, file), content, 'utf-8');
        console.log('Scaled up wrapper container in:', file);
    }
});
