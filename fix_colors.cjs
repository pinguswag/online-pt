const fs = require('fs');

// 1. Fix globals.css
let css = fs.readFileSync('src/app/globals.css', 'utf-8');
css = css.replace(/oklch\(([^/)]+?)\)/g, '$1');
css = css.replace(/oklch\(([^/)]+?)\s*\/\s*([^)]+)\)/g, '$1 / $2'); // for oklch(1 0 0 / 10%)
fs.writeFileSync('src/app/globals.css', css);

// 2. Fix tailwind.config.js
let tw = fs.readFileSync('tailwind.config.js', 'utf-8');
tw = tw.replace(/(: )"var\(--(.*?)\)"/g, '$1"oklch(var(--$2) / <alpha-value>)"');
fs.writeFileSync('tailwind.config.js', tw);

console.log('done');
