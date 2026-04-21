const fs = require('fs');
const files = [
  'src/app/(auth)/login/page.tsx', 'src/app/(auth)/signup/page.tsx', 
  'src/app/coach/dashboard/page.tsx', 'src/app/coach/member/[id]/consultation/page.tsx', 
  'src/app/coach/member/[id]/page.tsx'
];
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  // First fix casing
  c = c.replace(/@\/components\/ui\/Card/g, '@/components/ui/card');
  c = c.replace(/@\/components\/ui\/Button/g, '@/components/ui/button');
  c = c.replace(/@\/components\/ui\/Input/g, '@/components/ui/input');
  
  // Then fix label
  c = c.replace(/<Input([^>]*?)label="([^"]+)"([\s\S]*?)\/>/g, (match, before, label, after) => {
      return `<div>
    <label className="text-sm font-medium mb-1 block">${label}</label>
    <Input${before}${after}/>
</div>`;
  });
  fs.writeFileSync(f, c);
});
console.log('done');
