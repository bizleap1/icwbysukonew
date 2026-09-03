const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ffmpeg = require('ffmpeg-static');
const { execSync } = require('child_process');

async function runFullMigration() {
  console.log('=== STARTING SUKO FULL MEDIA PIPELINE MIGRATION ===\n');

  const stats = {
    videosProcessed: 0,
    imagesProcessed: 0,
    webpGenerated: 0,
    derivativesGenerated: 0,
    beforeBytes: 0,
    afterBytes: 0,
    oversizedCameraHandled: 0,
    intentionallyLargeDetails: [],
    skippedAssets: [],
    largestImagesAfter: [],
    largestVideosAfter: []
  };

  const fmtKB = (b) => (b / 1024).toFixed(1) + ' KB';
  const fmtMB = (b) => (b / (1024 * 1024)).toFixed(2) + ' MB';

  const brandFiles = ['logo.png', 'logo-light.png', 'favicon.ico', 'about_suko_brand.png'];

  // -------------------------------------------------------------
  // 1. ALL AUTOPLAY FASHION VIDEOS (Muted Background Films)
  // -------------------------------------------------------------
  const allVideos = [
    { name: 'hero_bg.mp4', posterTime: '00:00:01.000', crf: 21 },
    { name: 'about_suko.mp4', posterTime: '00:00:02.000', crf: 21 },
    { name: 'atlier_women.mp4', posterTime: '00:00:01.500', crf: 21 },
    { name: 'Woman_walking_in_business_district_202608311458.mp4', posterTime: '00:00:01.000', crf: 21 },
    { name: 'Woman_presenting_in_office_1080p_202608311521.mp4', posterTime: '00:00:01.000', crf: 21 },
    { name: 'Woman_walking_in_luxury_boardroom_202608311517.mp4', posterTime: '00:00:01.000', crf: 21 },
    { name: 'Woman_walking_in_luxury_interior_202608311530.mp4', posterTime: '00:00:01.000', crf: 21 },
    { name: 'world_of_suko.mp4', posterTime: '00:00:02.000', crf: 21 },
    { name: 'manifesto.mp4', posterTime: '00:00:01.000', crf: 21 }
  ];

  for (const v of allVideos) {
    const origPath = path.resolve('public', v.name);
    const backupPath = path.resolve('public', v.name.replace('.mp4', '_original.mp4'));
    const posterPath = path.resolve('public', v.name.replace('.mp4', '_poster.webp'));
    const tempOptPath = path.resolve('public', v.name.replace('.mp4', '_temp_opt.mp4'));

    if (!fs.existsSync(origPath) && !fs.existsSync(backupPath)) {
      stats.skippedAssets.push({ file: v.name, reason: 'File not found' });
      continue;
    }

    const sourcePath = fs.existsSync(backupPath) ? backupPath : origPath;
    const origSize = fs.statSync(sourcePath).size;
    stats.beforeBytes += origSize;

    // Backup original if not done
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(origPath, backupPath);
      console.log(`[Backup] ${v.name} -> ${path.basename(backupPath)}`);
    }

    // Generate WebP Poster Frame from clean timestamp
    if (!fs.existsSync(posterPath)) {
      try {
        const posterCmd = `"${ffmpeg}" -ss ${v.posterTime} -i "${backupPath}" -frames:v 1 -vf "scale='min(1920,iw)':-2" -q:v 92 -y "${posterPath}"`;
        execSync(posterCmd, { stdio: ['ignore', 'pipe', 'pipe'] });
        const posterSize = fs.statSync(posterPath).size;
        stats.derivativesGenerated++;
        stats.webpGenerated++;
        stats.afterBytes += posterSize;
        console.log(`[Poster Created] ${path.basename(posterPath)} (${fmtKB(posterSize)})`);
      } catch (e) {
        console.error(`Error generating poster for ${v.name}:`, e.message);
      }
    } else {
      stats.afterBytes += fs.statSync(posterPath).size;
    }

    // Re-encode if needed (audio removed, faststart enabled)
    // Check if already optimized in pilot
    const currentActiveSize = fs.existsSync(origPath) ? fs.statSync(origPath).size : 0;
    const alreadyOptimized = fs.existsSync(backupPath) && currentActiveSize < origSize;

    if (alreadyOptimized) {
      console.log(`[Video Already Optimized] ${v.name} (${fmtMB(currentActiveSize)})`);
      stats.afterBytes += currentActiveSize;
      stats.videosProcessed++;
      stats.largestVideosAfter.push({ name: v.name, sizeMB: Number((currentActiveSize / (1024 * 1024)).toFixed(2)) });
      continue;
    }

    try {
      console.log(`[Encoding Video] ${v.name} (CRF ${v.crf}, slow preset, +faststart, -an)...`);
      const encodeCmd = `"${ffmpeg}" -i "${backupPath}" -vf "scale='min(1920,iw)':-2" -c:v libx264 -preset slow -crf ${v.crf} -movflags +faststart -an -y "${tempOptPath}"`;
      execSync(encodeCmd, { stdio: ['ignore', 'pipe', 'pipe'] });

      const optSize = fs.statSync(tempOptPath).size;
      fs.copyFileSync(tempOptPath, origPath);
      fs.unlinkSync(tempOptPath);

      stats.afterBytes += optSize;
      stats.videosProcessed++;
      stats.largestVideosAfter.push({ name: v.name, sizeMB: Number((optSize / (1024 * 1024)).toFixed(2)) });
      console.log(`[Video Optimized] ${v.name}: ${fmtMB(origSize)} -> ${fmtMB(optSize)}\n`);
    } catch (e) {
      console.error(`Error encoding ${v.name}:`, e.message);
      stats.afterBytes += origSize;
    }
  }

  // -------------------------------------------------------------
  // 2. IMAGE PIPELINE (All 27 Products + Root Editorial Images)
  // -------------------------------------------------------------
  async function processImageFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) return;

    const baseName = path.basename(filePath);
    if (brandFiles.includes(baseName.toLowerCase())) {
      stats.skippedAssets.push({ file: filePath, reason: 'Brand identity asset (strictly preserved)' });
      return;
    }

    // Skip derivatives
    if (baseName.includes('-thumb.webp') || baseName.includes('-800w.webp') || baseName.includes('-1200w.webp') || baseName.includes('-1600w.webp') || baseName.endsWith('.webp')) {
      return;
    }

    const dir = path.dirname(filePath);
    const base = path.basename(filePath, ext);
    const origStat = fs.statSync(filePath);
    const origSize = origStat.size;
    stats.beforeBytes += origSize;
    stats.imagesProcessed++;

    const metadata = await sharp(filePath).metadata();
    const origWidth = metadata.width;
    const origHeight = metadata.height;
    const isGiantCameraFile = origWidth > 2000 || origHeight > 2000;

    // Macro / embroidery detail protection
    const isMacroOrDetail = base === '4' || base.includes('detail') || filePath.includes('embroidered');
    const fullWebpQuality = isMacroOrDetail ? 94 : 93;

    // 2a. Full / Primary WebP
    const fullWebpPath = path.join(dir, `${base}.webp`);
    if (isGiantCameraFile) {
      stats.oversizedCameraHandled++;
      // Proportional downscale to max 1600px long edge (zero crop, zero distortion)
      await sharp(filePath)
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: fullWebpQuality, effort: 6 })
        .toFile(fullWebpPath);
    } else {
      // Native dimensions (no resize, zero crop)
      await sharp(filePath)
        .webp({ quality: fullWebpQuality, effort: 6 })
        .toFile(fullWebpPath);
    }
    const fullWebpSize = fs.statSync(fullWebpPath).size;
    stats.webpGenerated++;
    stats.afterBytes += fullWebpSize;

    if (fullWebpSize > 250 * 1024) {
      stats.intentionallyLargeDetails.push({
        file: path.relative('public', fullWebpPath).replace(/\\/g, '/'),
        sizeKB: Math.round(fullWebpSize / 1024),
        dimensions: `${origWidth}x${origHeight}`,
        reason: isMacroOrDetail ? 'Macro embroidery / fabric texture preservation' : 'High detail photography'
      });
    }

    // 2b. Card Derivative (800w, fit inside, zero crop)
    const cardWebpPath = path.join(dir, `${base}-800w.webp`);
    if (origWidth > 800) {
      await sharp(filePath)
        .resize({ width: 800, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 92, effort: 6 })
        .toFile(cardWebpPath);
    } else {
      fs.copyFileSync(fullWebpPath, cardWebpPath);
    }
    stats.derivativesGenerated++;
    stats.webpGenerated++;

    // 2c. Tablet / Medium Derivative (1200w, fit inside, zero crop)
    if (origWidth > 1200) {
      const medWebpPath = path.join(dir, `${base}-1200w.webp`);
      await sharp(filePath)
        .resize({ width: 1200, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 92, effort: 6 })
        .toFile(medWebpPath);
      stats.derivativesGenerated++;
      stats.webpGenerated++;
    }

    // 2d. Thumbnail Derivative (240w, fit inside, zero crop)
    const thumbWebpPath = path.join(dir, `${base}-thumb.webp`);
    await sharp(filePath)
      .resize({ width: 240, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90, effort: 6 })
      .toFile(thumbWebpPath);
    stats.derivativesGenerated++;
    stats.webpGenerated++;

    stats.largestImagesAfter.push({
      file: path.relative('public', fullWebpPath).replace(/\\/g, '/'),
      sizeKB: Math.round(fullWebpSize / 1024)
    });
  }

  // Process Products Directory (All 27 Products)
  const productsDir = path.resolve('public/products');
  const prodFolders = fs.readdirSync(productsDir);
  console.log(`Processing ${prodFolders.length} product directories in public/products/...`);

  for (const pf of prodFolders) {
    const fullPf = path.join(productsDir, pf);
    if (!fs.statSync(fullPf).isDirectory()) continue;
    const files = fs.readdirSync(fullPf);
    for (const f of files) {
      await processImageFile(path.join(fullPf, f));
    }
  }

  // Process Root Editorial Images
  const publicDir = path.resolve('public');
  const rootFiles = fs.readdirSync(publicDir);
  console.log('Processing root editorial images in public/...');

  for (const rf of rootFiles) {
    const fullRf = path.join(publicDir, rf);
    if (fs.statSync(fullRf).isFile()) {
      await processImageFile(fullRf);
    }
  }

  // Sort largest for reporting
  stats.largestImagesAfter.sort((a, b) => b.sizeKB - a.sizeKB);
  stats.largestVideosAfter.sort((a, b) => b.sizeMB - a.sizeMB);

  fs.writeFileSync('./scripts/full_migration_report.json', JSON.stringify(stats, null, 2), 'utf8');

  console.log('\n=== FULL SUKO MEDIA MIGRATION COMPLETE ===\n');
  console.log(`Total Media Before Migration:  ${fmtMB(stats.beforeBytes)}`);
  console.log(`Total Media After Migration:   ${fmtMB(stats.afterBytes)}`);
  const totalReduction = (((stats.beforeBytes - stats.afterBytes) / stats.beforeBytes) * 100).toFixed(1);
  console.log(`Total Payload Reduction:       ${totalReduction}%`);
  console.log(`WebP Files Generated:          ${stats.webpGenerated}`);
  console.log(`Responsive Derivatives:        ${stats.derivativesGenerated}`);
  console.log(`Oversized Camera Files Handled: ${stats.oversizedCameraHandled}`);
  console.log(`Videos Processed:              ${stats.videosProcessed}`);
}

runFullMigration().catch(console.error);
