const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ffmpeg = require('ffmpeg-static');
const { execSync } = require('child_process');

async function runAudit() {
  const publicDir = path.resolve('public');

  const audit = {
    timestamp: new Date().toISOString(),
    totalMediaFiles: 0,
    totalSizeBytes: 0,
    videos: [],
    brandAssetsToExclude: [],
    oversizedCameraImages: [],
    uncompressedPngs: [],
    rootEditorialImages: [],
    productsSummary: {},
  };

  const brandNames = ['logo.png', 'logo-light.png', 'favicon.ico', 'about_suko_brand.png'];

  function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(walk(fullPath));
      } else {
        results.push(fullPath);
      }
    }
    return results;
  }

  const allFiles = walk(publicDir);

  for (const file of allFiles) {
    const relPath = path.relative(publicDir, file).replace(/\\/g, '/');
    const ext = path.extname(file).toLowerCase();
    const size = fs.statSync(file).size;

    if (!['.jpg', '.jpeg', '.png', '.webp', '.mp4'].includes(ext)) {
      continue;
    }

    audit.totalMediaFiles++;
    audit.totalSizeBytes += size;

    if (brandNames.includes(path.basename(file).toLowerCase())) {
      audit.brandAssetsToExclude.push({
        path: relPath,
        sizeKB: Math.round(size / 1024),
      });
      continue;
    }

    if (ext === '.mp4') {
      try {
        const ffprobeCmd = `"${ffmpeg}" -i "${file}" 2>&1`;
        let output = '';
        try {
          execSync(ffprobeCmd);
        } catch (err) {
          output = err.output ? err.output.toString() : err.message;
        }

        const durationMatch = output.match(/Duration:\s*(\d+:\d+:\d+\.\d+)/);
        const resolutionMatch = output.match(/Stream.*Video:.*,\s*(\d{3,4}x\d{3,4})/);
        const audioMatch = output.includes('Stream #0:1') && output.includes('Audio:');

        audit.videos.push({
          path: relPath,
          sizeMB: Number((size / (1024 * 1024)).toFixed(2)),
          sizeKB: Math.round(size / 1024),
          duration: durationMatch ? durationMatch[1] : 'Unknown',
          resolution: resolutionMatch ? resolutionMatch[1] : 'Unknown',
          hasAudio: audioMatch,
        });
      } catch (e) {
        audit.videos.push({
          path: relPath,
          sizeMB: Number((size / (1024 * 1024)).toFixed(2)),
          sizeKB: Math.round(size / 1024),
          error: e.message,
        });
      }
      continue;
    }

    try {
      const meta = await sharp(file).metadata();
      const isOversized = meta.width > 2000 || meta.height > 2000;
      const isProduct = relPath.startsWith('products/');

      const itemInfo = {
        path: relPath,
        width: meta.width,
        height: meta.height,
        format: meta.format,
        sizeMB: Number((size / (1024 * 1024)).toFixed(2)),
        sizeKB: Math.round(size / 1024),
        hasAlpha: meta.hasAlpha,
      };

      if (isOversized) {
        audit.oversizedCameraImages.push(itemInfo);
      } else if (ext === '.png' && size > 500 * 1024) {
        audit.uncompressedPngs.push(itemInfo);
      }

      if (!isProduct) {
        audit.rootEditorialImages.push(itemInfo);
      } else {
        const prodFolder = relPath.split('/')[1];
        if (!audit.productsSummary[prodFolder]) {
          audit.productsSummary[prodFolder] = { count: 0, sizeMB: 0, items: [] };
        }
        audit.productsSummary[prodFolder].count++;
        audit.productsSummary[prodFolder].sizeMB += size / (1024 * 1024);
        audit.productsSummary[prodFolder].items.push(itemInfo);
      }
    } catch (e) {
      console.error('Error reading', file, e.message);
    }
  }

  // Format summaries
  for (const k of Object.keys(audit.productsSummary)) {
    audit.productsSummary[k].sizeMB = Number(audit.productsSummary[k].sizeMB.toFixed(2));
  }

  audit.videos.sort((a, b) => b.sizeMB - a.sizeMB);
  audit.oversizedCameraImages.sort((a, b) => b.sizeKB - a.sizeKB);
  audit.uncompressedPngs.sort((a, b) => b.sizeKB - a.sizeKB);

  fs.writeFileSync('./scripts/audit_results.json', JSON.stringify(audit, null, 2), 'utf8');
  console.log('Audit complete! Total media payload:', (audit.totalSizeBytes / (1024 * 1024)).toFixed(2), 'MB');
  console.log('Videos count:', audit.videos.length);
  console.log('Oversized camera files (>2000px):', audit.oversizedCameraImages.length);
  console.log('Uncompressed PNGs (>500KB):', audit.uncompressedPngs.length);
  console.log('Brand assets excluded:', audit.brandAssetsToExclude.length);
}

runAudit();
