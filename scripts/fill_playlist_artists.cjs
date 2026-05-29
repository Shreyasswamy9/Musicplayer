const fs = require('fs');
// `music-metadata` is ESM-only; dynamically import when running the script.
const path = require('path');

(async function(){
  try {
    const playlistPath = path.join(__dirname,'..','audio','playlist.json');
    const raw = fs.readFileSync(playlistPath,'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('playlist.json not an array');

    const out = [];
    const mmMod = await import('music-metadata');
    const mm = mmMod && mmMod.default ? mmMod.default : mmMod;

    for (const e of parsed) {
      const entry = { ...e };
      if (typeof entry.artist === 'string' && entry.artist.trim()) {
        out.push(entry);
        continue;
      }
      const file = path.join(__dirname,'..','audio', entry.file || '');
      try {
        const m = await mm.parseFile(file, { duration: false });
        const artist = m.common.artist || (m.common.artists && m.common.artists.join(', '));
        entry.artist = artist || '';
      } catch (err) {
        entry.artist = '';
      }
      out.push(entry);
    }

    fs.writeFileSync(playlistPath, JSON.stringify(out, null, 2), 'utf8');
    console.log('Updated', playlistPath);
  } catch (err) {
    console.error('failed:', err.message);
    process.exit(1);
  }
})();
