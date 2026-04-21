const fs = require('fs');
const files = [
  'src/app/(auth)/login/page.tsx', 'src/app/(auth)/signup/page.tsx', 
  'src/app/coach/dashboard/page.tsx', 'src/app/coach/member/[id]/consultation/page.tsx', 
  'src/app/coach/member/[id]/page.tsx', 'src/app/member/daily/[date]/page.tsx',
  'src/app/member/dashboard/page.tsx'
];
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/variant="primary"/g, 'variant="default"');
  c = c.replace(/size="l"/g, 'size="lg"');
  c = c.replace(/size="s"/g, 'size="sm"');
  fs.writeFileSync(f, c);
});
console.log('button variants fixed');
