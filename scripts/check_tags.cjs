const fs = require('fs');
// `music-metadata` is ESM-only; dynamically import when running the script.
const path = require('path');

(async function(){
  try {
    const raw = fs.readFileSync(path.join(__dirname,'..','audio','playlist.json'),'utf8');
    const parsed = JSON.parse(raw);
    const mmMod = await import('music-metadata');
    const mm = mmMod && mmMod.default ? mmMod.default : mmMod;

    for (const e of parsed) {
      const file = path.join(__dirname,'..','audio', e.file);
      try {
        const m = await mm.parseFile(file, { duration: false });
        const artist = m.common.artist || (m.common.artists && m.common.artists.join(', '));
        console.log(e.file, '=>', artist || '(no tag)');
      } catch (err) {
        console.log(e.file, '=>', '(missing or unreadable)');
      }
    }
  } catch (err) {
    console.error('failed:', err.message);
    process.exit(1);
  }
})();
