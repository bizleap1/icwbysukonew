const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ffmpeg = require('ffmpeg-static');
const { execSync } = require('child_process');

async function runPilot() {
  console.log('=== STARTING SUKO MEDIA OPTIMIZATION PILOT ===\n');

  const report = {
    videos: [],
    images: [],
    summary: {
      originalTotalBytes: 0,
      optimizedTotalBytes: 0
    }
  };

  // Helper for human-readable sizes
  const fmtKB = (b) => (b / 1024).toFixed(1) + ' KB';
  const fmtMB = (b) => (b / (1024 * 1024)).toFixed(2) + ' MB';

  // -------------------------------------------------------------
  // 1. VIDEO PILOT: hero_bg.mp4 & about_suko.mp4
  // -------------------------------------------------------------
  const pilotVideos = [
    { name: 'hero_bg.mp4', posterTime: '00:00:01.000' },
    { name: 'about_suko.mp4', posterTime: '00:00:02.000' }
  ];

  for (const v of pilotVideos) {
    const origPath = path.resolve('public', v.name);
    const backupPath = path.resolve('public', v.name.replace('.mp4', '_original.mp4'));
    const posterPath = path.resolve('public', v.name.replace('.mp4', '_poster.webp'));
    const tempOptPath = path.resolve('public', v.name.replace('.mp4', '_temp_opt.mp4'));

    if (!fs.existsSync(origPath)) {
      console.warn('Video not found:', origPath);
      continue;
    }

    const origSize = fs.statSync(origPath).size;

    // 1a. Create safe backup of original video if not exists
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(origPath, backupPath);
      console.log(`[Backup Created] ${v.name} -> ${path.basename(backupPath)}`);
    }

    // 1b. Generate WebP Poster Frame from original
    try {
      const posterCmd = `"${ffmpeg}" -ss ${v.posterTime} -i "${backupPath}" -frames:v 1 -vf "scale='min(1920,iw)':-2" -q:v 92 -y "${posterPath}"`;
      execSync(posterCmd, { stdio: ['ignore', 'pipe', 'pipe'] });
      const posterSize = fs.statSync(posterPath).size;
      console.log(`[Poster Generated] ${path.basename(posterPath)} (${fmtKB(posterSize)})`);
    } catch (e) {
      console.error(`Error generating poster for ${v.name}:`, e.message);
    }

    // 1c. Re-encode video using CRF 21 (High-Quality Luxury Profile), strip audio, +faststart
    try {
      console.log(`[Encoding Video] ${v.name} (CRF 21, slow preset, streaming faststart, no audio)...`);
      const encodeCmd = `"${ffmpeg}" -i "${backupPath}" -vf "scale='min(1920,iw)':-2" -c:v libx264 -preset slow -crf 21 -movflags +faststart -an -y "${tempOptPath}"`;
      execSync(encodeCmd, { stdio: ['ignore', 'pipe', 'pipe'] });

      const optSize = fs.statSync(tempOptPath).size;

      // Replace active video with optimized version (original remains in backupPath)
      fs.copyFileSync(tempOptPath, origPath);
      fs.unlinkSync(tempOptPath);

      report.videos.push({
        file: v.name,
        originalSize: fmtMB(origSize),
        optimizedSize: fmtMB(optSize),
        reduction: (((origSize - optSize) / origSize) * 100).toFixed(1) + '%',
        poster: path.basename(posterPath)
      });

      report.summary.originalTotalBytes += origSize;
      report.summary.optimizedTotalBytes += optSize;
      console.log(`[Video Optimized] ${v.name}: ${fmtMB(origSize)} -> ${fmtMB(optSize)} (${report.videos[report.videos.length - 1].reduction} reduction)\n`);
    } catch (e) {
      console.error(`Error encoding video ${v.name}:`, e.message);
    }
  }

  // -------------------------------------------------------------
  // 2. IMAGE PILOT: 3 Selected Products + 1 Editorial Asset
  // -------------------------------------------------------------
  const pilotImageDirs = [
    'public/products/the-noir-tailored-suit',
    'public/products/the-plum-sculpted-suit',
    'public/products/dusty-rose-embroidered-farchi-tunic'
  ];

  const pilotStandaloneImages = [
    'public/home_signature.png'
  ];

  // Helper to process a single image file non-destructively
  async function processImage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) return;

    // Skip derivatives if script is re-run
    if (filePath.includes('-thumb.webp') || filePath.includes('-800w.webp') || filePath.includes('-1200w.webp') || filePath.includes('-1600w.webp') || filePath.endsWith('.webp')) {
      return;
    }

    const dir = path.dirname(filePath);
    const base = path.basename(filePath, ext);
    const origStat = fs.statSync(filePath);
    const origSize = origStat.size;

    const metadata = await sharp(filePath).metadata();
    const origWidth = metadata.width;
    const origHeight = metadata.height;

    // 2a. Full-resolution WebP (Prism Quality: 93, effort: 6, NO resize, NO crop)
    const fullWebpPath = path.join(dir, `${base}.webp`);
    await sharp(filePath)
      .webp({ quality: 93, effort: 6, lossless: false })
      .toFile(fullWebpPath);
    const fullWebpSize = fs.statSync(fullWebpPath).size;

    // 2b. Card / Mobile derivative (800w, proportional resize, NO crop)
    const cardWebpPath = path.join(dir, `${base}-800w.webp`);
    if (origWidth > 800) {
      await sharp(filePath)
        .resize({ width: 800, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 92, effort: 6 })
        .toFile(cardWebpPath);
    } else {
      // If image is already smaller or equal to 800px, copy fullWebp
      fs.copyFileSync(fullWebpPath, cardWebpPath);
    }
    const cardWebpSize = fs.statSync(cardWebpPath).size;

    // 2c. Tablet / Medium derivative (1200w, proportional resize, NO crop)
    const medWebpPath = path.join(dir, `${base}-1200w.webp`);
    if (origWidth > 1200) {
      await sharp(filePath)
        .resize({ width: 1200, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 92, effort: 6 })
        .toFile(medWebpPath);
    }

    // 2d. Thumbnail rail derivative (240w, proportional resize, NO crop)
    const thumbWebpPath = path.join(dir, `${base}-thumb.webp`);
    await sharp(filePath)
      .resize({ width: 240, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90, effort: 6 })
      .toFile(thumbWebpPath);
    const thumbWebpSize = fs.statSync(thumbWebpPath).size;

    const relPath = path.relative('public', filePath).replace(/\\/g, '/');

    report.images.push({
      file: relPath,
      dimensions: `${origWidth}x${origHeight}`,
      originalSize: fmtKB(origSize),
      fullWebpSize: fmtKB(fullWebpSize),
      card800wSize: fmtKB(cardWebpSize),
      thumbSize: fmtKB(thumbWebpSize),
      reductionFull: (((origSize - fullWebpSize) / origSize) * 100).toFixed(1) + '%'
    });

    report.summary.originalTotalBytes += origSize;
    report.summary.optimizedTotalBytes += fullWebpSize;
  }

  // Process all images in the 3 pilot folders
  for (const d of pilotImageDirs) {
    const fullDir = path.resolve(d);
    if (!fs.existsSync(fullDir)) continue;
    const files = fs.readdirSync(fullDir);
    for (const f of files) {
      await processImage(path.join(fullDir, f));
    }
  }

  // Process standalone editorial image
  for (const f of pilotStandaloneImages) {
    await processImage(path.resolve(f));
  }

  // -------------------------------------------------------------
  // 3. WRITE AUDIT / PILOT REPORT
  // -------------------------------------------------------------
  fs.writeFileSync('./scripts/pilot_report.json', JSON.stringify(report, null, 2), 'utf8');

  console.log('=== PILOT OPTIMIZATION COMPLETE ===\n');
  console.log(`Original Pilot Assets Total:  ${fmtMB(report.summary.originalTotalBytes)}`);
  console.log(`Optimized Pilot Assets Total: ${fmtMB(report.summary.optimizedTotalBytes)}`);
  const overallReduction = (((report.summary.originalTotalBytes - report.summary.optimizedTotalBytes) / report.summary.originalTotalBytes) * 100).toFixed(1);
  console.log(`Overall Reduction: ${overallReduction}%\n`);
}

runPilot().catch(console.error);
