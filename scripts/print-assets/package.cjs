/* Package only manifest-listed approved rasters; candidate directories are never copied. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const repo=path.resolve(__dirname,'../..');
require('../../src/print-layout/raster-assets.js');
require('../../src/print-layout/raster-manifest.js');
if(!process.argv[2])throw Error('Usage: node scripts/print-assets/package.cjs OUTPUT_DIRECTORY');
const output=path.resolve(process.argv[2]);
let count=0;
for(const asset of PrintRasterAssets.list())for(const rendition of Object.values(asset.renditions)){
 const source=path.resolve(repo,rendition.url),target=path.resolve(output,rendition.url);
 if(!fs.statSync(source).isFile())throw Error('Missing approved rendition: '+rendition.url);
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);count++;
}
console.log(JSON.stringify({approvedAssets:PrintRasterAssets.list().length,packagedRenditions:count}));
