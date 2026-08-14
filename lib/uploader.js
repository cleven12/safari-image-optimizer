const cloudinary = require('cloudinary').v2;
const chalk = require('chalk');
const path = require('path');

async function uploadToCloudinary(results, config) {
  cloudinary.config({
    cloud_name: config.cloud_name,
    api_key: config.api_key,
    api_secret: config.api_secret,
    secure: true
  });

  const uploaded = [];
  const failed = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const filename = path.basename(result.outputPath, path.extname(result.outputPath));

    try {
      process.stdout.write(chalk.gray(`   [${i + 1}/${results.length}] Uploading ${filename}... `));

      const uploadResult = await cloudinary.uploader.upload(result.outputPath, {
        folder: config.folder,
        public_id: filename,
        overwrite: true,
        resource_type: 'image',
        // Add metadata for SEO
        context: {
          alt: `Safari image - ${filename}`,
          source: 'safari-image-optimizer'
        },
        // Auto-tag for organization
        tags: ['safari', 'optimized', 'watermarked']
      });

      console.log(chalk.green(`✓ ${uploadResult.secure_url}`));
      uploaded.push({
        localPath: result.outputPath,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        bytes: uploadResult.bytes
      });

    } catch (err) {
      console.log(chalk.red(`✗ ${err.message}`));
      failed.push({ file: filename, error: err.message });
    }
  }

  console.log(chalk.green(`\n   Uploaded: ${uploaded.length}, Failed: ${failed.length}\n`));

  return { uploaded, failed };
}

module.exports = { uploadToCloudinary };
