#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs').promises;
const { processImages } = require('../lib/processor');
const { uploadToCloudinary } = require('../lib/uploader');

const program = new Command();

program
  .name('safari-opt')
  .description('Optimize safari images: resize, compress, watermark, upload to Cloudinary')
  .version('1.0.0');

program
  .command('optimize')
  .description('Batch optimize images from input directory')
  .requiredOption('-i, --input <path>', 'Input directory containing raw safari images')
  .requiredOption('-o, --output <path>', 'Output directory for optimized images')
  .requiredOption('-w, --watermark <path>', 'Path to watermark/logo image (PNG with transparency recommended)')
  .option('--width <number>', 'Max width in pixels', '1920')
  .option('--quality <number>', 'JPEG quality (1-100)', '85')
  .option('--format <type>', 'Output format: jpeg, webp, avif', 'jpeg')
  .option('--watermark-scale <number>', 'Watermark width as % of image width', '15')
  .option('--watermark-opacity <number>', 'Watermark opacity (0-1)', '0.6')
  .option('--watermark-position <pos>', 'Position: center, top-left, top-right, bottom-left, bottom-right', 'bottom-right')
  .option('--target-size <kb>', 'Target max file size in KB (approximate)', '500')
  .option('--cloudinary', 'Upload optimized images to Cloudinary', false)
  .option('--cloud-name <name>', 'Cloudinary cloud name')
  .option('--api-key <key>', 'Cloudinary API key')
  .option('--api-secret <secret>', 'Cloudinary API secret')
  .option('--cloud-folder <folder>', 'Cloudinary folder path', 'safari-optimized')
  .option('--preserve-structure', 'Preserve subdirectory structure in output', false)
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('\n🦁 Safari Image Optimizer\n'));

      // Validate inputs
      const inputDir = path.resolve(options.input);
      const outputDir = path.resolve(options.output);
      const watermarkPath = path.resolve(options.watermark);

      try {
        await fs.access(inputDir);
      } catch {
        console.error(chalk.red(`❌ Input directory not found: ${inputDir}`));
        process.exit(1);
      }

      try {
        await fs.access(watermarkPath);
      } catch {
        console.error(chalk.red(`❌ Watermark image not found: ${watermarkPath}`));
        process.exit(1);
      }

      await fs.mkdir(outputDir, { recursive: true });

      // Cloudinary config
      let cloudinaryConfig = null;
      if (options.cloudinary) {
        if (!options.cloudName || !options.apiKey || !options.apiSecret) {
          console.error(chalk.red('❌ Cloudinary credentials required. Use --cloud-name, --api-key, --api-secret'));
          process.exit(1);
        }
        cloudinaryConfig = {
          cloud_name: options.cloudName,
          api_key: options.apiKey,
          api_secret: options.apiSecret,
          folder: options.cloudFolder
        };
      }

      const config = {
        inputDir,
        outputDir,
        watermarkPath,
        maxWidth: parseInt(options.width),
        quality: parseInt(options.quality),
        format: options.format,
        watermarkScale: parseInt(options.watermarkScale) / 100,
        watermarkOpacity: parseFloat(options.watermarkOpacity),
        watermarkPosition: options.watermarkPosition,
        targetSizeKB: parseInt(options.targetSize),
        preserveStructure: options.preserveStructure,
        cloudinary: cloudinaryConfig
      };

      const results = await processImages(config);

      // Upload if requested
      if (cloudinaryConfig && results.success.length > 0) {
        console.log(chalk.blue('\n☁️  Uploading to Cloudinary...\n'));
        await uploadToCloudinary(results.success, cloudinaryConfig);
      }

      // Summary
      console.log(chalk.green.bold('\n✅ Done!\n'));
      console.log(chalk.white(`   Total processed: ${results.total}`));
      console.log(chalk.green(`   Successful: ${results.success.length}`));
      if (results.failed.length > 0) {
        console.log(chalk.red(`   Failed: ${results.failed.length}`));
        results.failed.forEach(f => console.log(chalk.gray(`      - ${f.file}: ${f.error}`)));
      }

      const totalBefore = results.success.reduce((a, b) => a + b.originalSize, 0);
      const totalAfter = results.success.reduce((a, b) => a + b.optimizedSize, 0);
      const savings = ((1 - totalAfter / totalBefore) * 100).toFixed(1);

      console.log(chalk.cyan(`\n   Size reduction: ${(totalBefore / 1024 / 1024).toFixed(1)}MB → ${(totalAfter / 1024).toFixed(1)}KB (${savings}% saved)\n`));

    } catch (err) {
      console.error(chalk.red(`\n❌ Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Show example Cloudinary environment setup')
  .action(() => {
    console.log(chalk.blue.bold('\n☁️  Cloudinary Environment Setup\n'));
    console.log(chalk.white('Set these environment variables to avoid passing credentials every time:\n'));
    console.log(chalk.yellow('   export CLOUDINARY_CLOUD_NAME=your_cloud_name'));
    console.log(chalk.yellow('   export CLOUDINARY_API_KEY=your_api_key'));
    console.log(chalk.yellow('   export CLOUDINARY_API_SECRET=your_api_secret'));
    console.log(chalk.white('\nThen run with --cloudinary flag only:\n'));
    console.log(chalk.green('   safari-opt optimize -i ./raw -o ./out -w ./logo.png --cloudinary\n'));
  });

program.parse();
