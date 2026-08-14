const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const chalk = require('chalk');
const cliProgress = require('cli-progress');
const mime = require('mime-types');

const SUPPORTED_INPUT = ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.webp', '.avif', '.heic'];

async function getImageFiles(dir, preserveStructure, baseDir = dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await getImageFiles(fullPath, preserveStructure, baseDir);
      files.push(...subFiles);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_INPUT.includes(ext)) {
        const relPath = preserveStructure ? path.relative(baseDir, dir) : '';
        files.push({
          inputPath: fullPath,
          relativeDir: relPath,
          filename: path.basename(entry.name, ext),
          ext: ext
        });
      }
    }
  }

  return files;
}

function getWatermarkPosition(position, imgWidth, imgHeight, wmWidth, wmHeight) {
  const padding = Math.round(Math.min(imgWidth, imgHeight) * 0.03); // 3% padding

  switch (position) {
    case 'top-left':
      return { left: padding, top: padding };
    case 'top-right':
      return { left: imgWidth - wmWidth - padding, top: padding };
    case 'bottom-left':
      return { left: padding, top: imgHeight - wmHeight - padding };
    case 'bottom-right':
      return { left: imgWidth - wmWidth - padding, top: imgHeight - wmHeight - padding };
    case 'center':
    default:
      return { left: Math.round((imgWidth - wmWidth) / 2), top: Math.round((imgHeight - wmHeight) / 2) };
  }
}

async function optimizeSingle(file, config, watermarkBuffer, bar) {
  try {
    const inputBuffer = await fs.readFile(file.inputPath);
    const originalSize = inputBuffer.length;

    // Get image metadata
    const metadata = await sharp(inputBuffer).metadata();

    // Determine output extension
    const outputExt = config.format === 'jpeg' ? '.jpg' : `.${config.format}`;
    const outputDir = config.preserveStructure
      ? path.join(config.outputDir, file.relativeDir)
      : config.outputDir;

    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, `${file.filename}${outputExt}`);

    // Build sharp pipeline
    let pipeline = sharp(inputBuffer);

    // Resize if wider than maxWidth
    if (metadata.width > config.maxWidth) {
      pipeline = pipeline.resize(config.maxWidth, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }

    // Get dimensions after resize for watermark sizing
    const resizedBuffer = await pipeline.toBuffer({ resolveWithObject: true });
    const imgWidth = resizedBuffer.info.width;
    const imgHeight = resizedBuffer.info.height;

    // Calculate watermark size (e.g., 15% of image width)
    const wmTargetWidth = Math.round(imgWidth * config.watermarkScale);
    const wmResized = await sharp(watermarkBuffer)
      .resize(wmTargetWidth, null, { fit: 'inside' })
      .toBuffer();

    const wmMeta = await sharp(wmResized).metadata();
    const pos = getWatermarkPosition(config.watermarkPosition, imgWidth, imgHeight, wmMeta.width, wmMeta.height);

    // Composite watermark
    pipeline = sharp(resizedBuffer.data).composite([{
      input: wmResized,
      left: pos.left,
      top: pos.top,
      blend: 'over',
      opacity: Math.round(config.watermarkOpacity * 255)
    }]);

    // Output format and quality
    let outputBuffer;
    if (config.format === 'jpeg') {
      outputBuffer = await pipeline.jpeg({
        quality: config.quality,
        progressive: true,
        mozjpeg: true,
        optimize: true
      }).toBuffer();
    } else if (config.format === 'webp') {
      outputBuffer = await pipeline.webp({
        quality: config.quality,
        effort: 6
      }).toBuffer();
    } else if (config.format === 'avif') {
      outputBuffer = await pipeline.avif({
        quality: config.quality,
        effort: 4
      }).toBuffer();
    }

    // If still too large, reduce quality iteratively
    let finalBuffer = outputBuffer;
    let finalQuality = config.quality;

    while (finalBuffer.length > config.targetSizeKB * 1024 && finalQuality > 30) {
      finalQuality -= 5;
      if (config.format === 'jpeg') {
        finalBuffer = await sharp(resizedBuffer.data)
          .composite([{
            input: wmResized,
            left: pos.left,
            top: pos.top,
            blend: 'over',
            opacity: Math.round(config.watermarkOpacity * 255)
          }])
          .jpeg({ quality: finalQuality, progressive: true, mozjpeg: true })
          .toBuffer();
      } else if (config.format === 'webp') {
        finalBuffer = await sharp(resizedBuffer.data)
          .composite([{
            input: wmResized,
            left: pos.left,
            top: pos.top,
            blend: 'over',
            opacity: Math.round(config.watermarkOpacity * 255)
          }])
          .webp({ quality: finalQuality })
          .toBuffer();
      }
    }

    await fs.writeFile(outputPath, finalBuffer);

    bar.increment();

    return {
      success: true,
      file: path.basename(file.inputPath),
      outputPath,
      originalSize,
      optimizedSize: finalBuffer.length,
      quality: finalQuality,
      dimensions: { width: imgWidth, height: imgHeight }
    };

  } catch (err) {
    bar.increment();
    return {
      success: false,
      file: path.basename(file.inputPath),
      error: err.message
    };
  }
}

async function processImages(config) {
  const imageFiles = await getImageFiles(config.inputDir, config.preserveStructure);

  if (imageFiles.length === 0) {
    throw new Error('No supported image files found in input directory');
  }

  console.log(chalk.blue(`📁 Found ${imageFiles.length} image(s) to process`));
  console.log(chalk.blue(`🎯 Target: max ${config.maxWidth}px width, ~${config.targetSizeKB}KB, ${config.format.toUpperCase()}, ${config.quality}% quality`));
  console.log(chalk.blue(`💧 Watermark: ${config.watermarkPosition}, ${config.watermarkScale * 100}% width, ${config.watermarkOpacity * 100}% opacity\n`));

  // Load watermark once
  const watermarkBuffer = await fs.readFile(config.watermarkPath);

  // Progress bar
  const bar = new cliProgress.SingleBar({
    format: '   ' + chalk.cyan('{bar}') + ' {percentage}% | {value}/{total} images | {filename}',
    barCompleteChar: '█',
    barIncompleteChar: '░',
    hideCursor: true
  }, cliProgress.Presets.shades_classic);

  bar.start(imageFiles.length, 0, { filename: 'starting...' });

  const results = {
    total: imageFiles.length,
    success: [],
    failed: []
  };

  // Process sequentially to avoid memory issues with large safari images
  for (const file of imageFiles) {
    bar.update({ filename: path.basename(file.inputPath).substring(0, 30) });
    const result = await optimizeSingle(file, config, watermarkBuffer, bar);

    if (result.success) {
      results.success.push(result);
    } else {
      results.failed.push(result);
    }
  }

  bar.stop();

  return results;
}

module.exports = { processImages };
