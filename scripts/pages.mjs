import {rmSync,cpSync,writeFileSync} from 'node:fs';
rmSync(new URL('../docs',import.meta.url),{recursive:true,force:true});
cpSync(new URL('../dist',import.meta.url),new URL('../docs',import.meta.url),{recursive:true});
writeFileSync(new URL('../docs/.nojekyll',import.meta.url),'');
