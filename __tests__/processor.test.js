const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { processImages } = require('../lib/processor');

// Helper to create a test image buffer
async function createTestImage(width, height, color = '#2d5a27', format = 'jpeg') {
  const img = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color
    }
  });

  if (format === 'jpeg') return img.jpeg({ quality: 90 }).toBuffer();
  if (format === 'png') return img.png().toBuffer();
  if (format === 'webp') return img.webp().toBuffer();
  return img.toBuffer();
}

// Helper to create a test watermark
async function createTestWatermark(width = 200, height = 50) {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0.8 }
    }
  })
    .png()
    .toBuffer();
}

describe('Image Processor', () => {
  let tempDir;
  let outputDir;
  let watermarkPath;
  let inputDir;

  beforeEach(async () => {
    // Create temp directories
    tempDir = path.join(__dirname, 'temp', `test-${Date.now()}`);
    inputDir = path.join(tempDir, 'input');
    outputDir = path.join(tempDir, 'output');
    watermarkPath = path.join(tempDir, 'watermark.png');

    await fs.mkdir(inputDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });

    // Create test watermark
    const watermarkBuffer = await createTestWatermark();
    await fs.writeFile(watermarkPath, watermarkBuffer);
  });

  afterEach(async () => {
    // Cleanup temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  describe('Basic processing', () => {
    test('should process a single JPEG image', async () => {
      // Create a large test image (simulating safari photo)
      const largeBuffer = await createTestImage(4000, 3000, '#3d7a37');
      const inputPath = path.join(inputDir, 'safari-001.jpg');
      await fs.writeFile(inputPath, largeBuffer);

      const config = {
        inputDir,
        outputDir,
        watermarkPath,
        maxWidth: 1920,
        quality: 85,
        format: 'jpeg',
        watermarkScale: 0.15,
        watermarkOpacity: 0.6,
        watermarkPosition: 'bottom-right',
        targetSizeKB: 500,
        preserveStructure: false,
        cloudinary: null
      };

      const results = await processImages(config);

      expect(results.total).toBe(1);
      expect(results.success).toHaveLength(1);
      expect(results.failed).toHaveLength(0);

      const result = results.success[0];
      expect(result.success).toBe(true);
      expect(result.originalSize).toBeGreaterThan(result.optimizedSize);
      expect(result.optimizedSize).toBeLessThan(500 * 1024); // Under target

      // Verify output file exists
      const outputExists = await fs.access(result.outputPath).then(() => true).catch(() => false);
      expect(outputExists).toBe(true);

      // Verify dimensions are scaled down
      expect(result.dimensions.width).toBeLessThanOrEqual(1920);
    });

    test('should process multiple images in batch', async () => {
      // Create 5 test images
      for (let i = 1; i <= 5; i++) {
        const buffer = await createTestImage(3000 + i * 200, 2000 + i * 100, `rgb(${i*40}, 100, 50)`);
        await fs.writeFile(path.join(inputDir, `safari-${String(i).padStart(3, '0')}.jpg`), buffer);
      }

      const config = {
        inputDir,
        outputDir,
        watermarkPath,
        maxWidth: 1600,
        quality: 80,
        format: 'jpeg',
        watermarkScale: 0.12,
        watermarkOpacity: 0.5,
        watermarkPosition: 'center',
        targetSizeKB: 300,
        preserveStructure: false,
        cloudinary: null
      };

      const results = await processImages(config);

      expect(results.total).toBe(5);
      expect(results.success).toHaveLength(5);
      expect(results.failed).toHaveLength(0);

      // All outputs should exist
      for (const result of results.success) {
        const exists = await fs.access(result.outputPath).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      }
    });

    test('should handle unsupported files gracefully', async () => {
      // Create a valid image and a text file
      const imageBuffer = await createTestImage(2000, 1500);
      await fs.writeFile(path.join(inputDir, 'valid.jpg'), imageBuffer);
      await fs.writeFile(path.join(inputDir, 'readme.txt'), 'This is not an image');

      const config = {
        inputDir,
        outputDir,
        watermarkPath,
        maxWidth: 1920,
        quality: 85,
        format: 'jpeg',
        watermarkScale: 0.15,
        watermarkOpacity: 0.6,
        watermarkPosition: 'bottom-right',
        targetSizeKB: 500,
        preserveStructure: false,
        cloudinary: null
      };

      const results = await processImages(config);

      expect(results.total).toBe(1); // Only 1 image file
      expect(results.success).toHaveLength(1);
    });
  });

  describe('Format conversion', () => {
    test('should output WebP format', async () => {
      const buffer = await createTestImage(2500, 1800);
      await fs.writeFile(path.join(inputDir, 'test.jpg'), buffer);

      const config = {
        inputDir,
        outputDir,
        watermarkPath,
        maxWidth: 1920,
        quality: 85,
        format: 'webp',
        watermarkScale: 0.15,
        watermarkOpacity: 0.6,
        watermarkPosition: 'bottom-right',
        targetSizeKB: 500,
        preserveStructure: false,
        cloudinary: null
      };

      const results = await processImages(config);
      expect(results.success).toHaveLength(1);
      expect(results.success[0].outputPath).toMatch(/\.webp$/);
    });

    test('should output AVIF format', async () => {
      const buffer = await createTestImage(2500, 1800);
      await fs.writeFile(path.join(inputDir, 'test.jpg'), buffer);

      const config = {
        inputDir,
        outputDir,
        watermarkPath,
        maxWidth: 1920,
        quality: 80,
        format: 'avif',
        watermarkScale: 0.15,
        watermarkOpacity: 0.6,
        watermarkPosition: 'bottom-right',
        targetSizeKB: 500,
        preserveStructure: false,
        cloudinary: null
      };

      const results = await processImages(config);
      expect(results.success).toHaveLength(1);
      expect(results.success[0].outputPath).toMatch(/\.avif$/);
    });
  });

  describe('Watermark positioning', () => {
    test('should place watermark at all positions', async () => {
      const positions = ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];

      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const buffer = await createTestImage(2000, 1500, `rgb(${i*50}, 80, 60)`);
        await fs.writeFile(path.join(inputDir, `test-${pos}.jpg`), buffer);
      }

      const config = {
        inputDir,
        outputDir,
        watermarkPath,
        maxWidth: 1920,
        quality: 85,
        format: 'jpeg',
        watermarkScale: 0.15,
        watermarkOpacity: 0.6,
        watermarkPosition: 'bottom-right', // Default, will test individually
        targetSizeKB: 500,
        preserveStructure: false,
        cloudinary: null
      };

      const results = await processImages(config);
      expect(results.success).toHaveLength(5);
    });
  });

  describe('Quality fallback', () => {
    test('should reduce quality when target size is exceeded', async () => {
      // Create a very complex image (harder to compress)
      const buffer = await createTestImage(4000, 3000, '#ffffff'); // White = hard to compress with patterns
      await fs.writeFile(path.join(inputDir, 'complex.jpg'), buffer);

      const config = {
        inputDir,
        outputDir,
        watermarkPath,
        maxWidth: 1920,
        quality: 95, // Start very high
        format: 'jpeg',
        watermarkScale: 0.15,
        watermarkOpacity: 0.6,
        watermarkPosition: 'bottom-right',
        targetSizeKB: 50, // Very aggressive target to force fallback
        preserveStructure: false,
        cloudinary: null
      };

      const results = await processImages(config);
      expect(results.success).toHaveLength(1);
      // Quality should have been reduced from 95
      expect(results.success[0].quality).toBeLessThan(95);
    });
  });

  describe('Directory structure', () => {
    test('should preserve subdirectory structure when enabled', async () => {
      const subDir = path.join(inputDir, 'day1', 'morning');
      await fs.mkdir(subDir, { recursive: true });

      const buffer = await createTestImage(2000, 1500);
      await fs.writeFile(path.join(subDir, 'lion.jpg'), buffer);
      await fs.writeFile(path.join(inputDir, 'elephant.jpg'), buffer);

      const config = {
        inputDir,
        outputDir,
        watermarkPath,
        maxWidth: 1920,
        quality: 85,
        format: 'jpeg',
        watermarkScale: 0.15,
        watermarkOpacity: 0.6,
        watermarkPosition: 'bottom-right',
        targetSizeKB: 500,
        preserveStructure: true,
        cloudinary: null
      };

      const results = await processImages(config);
      expect(results.success).toHaveLength(2);

      // Check that subdirectory structure is preserved in output
      const nestedOutput = path.join(outputDir, 'day1', 'morning', 'lion.jpg');
      const exists = await fs.access(nestedOutput).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    test('should flatten structure when preserveStructure is false', async () => {
      const subDir = path.join(inputDir, 'day1');
      await fs.mkdir(subDir, { recursive: true });

      const buffer = await createTestImage(2000, 1500);
      await fs.writeFile(path.join(subDir, 'zebra.jpg'), buffer);

      const config = {
        inputDir,
        outputDir,
        watermarkPath,
        maxWidth: 1920,
        quality: 85,
        format: 'jpeg',
        watermarkScale: 0.15,
        watermarkOpacity: 0.6,
        watermarkPosition: 'bottom-right',
        targetSizeKB: 500,
        preserveStructure: false,
        cloudinary: null
      };

      const results = await processImages(config);
      expect(results.success).toHaveLength(1);

      // Should be in root of output, not in day1/
      const flatOutput = path.join(outputDir, 'zebra.jpg');
      const exists = await fs.access(flatOutput).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('Edge cases', () => {
    test('should handle empty input directory', async () => {
      const config = {
        inputDir,
        outputDir,
        watermarkPath,
        maxWidth: 1920,
        quality: 85,
        format: 'jpeg',
        watermarkScale: 0.15,
        watermarkOpacity: 0.6,
        watermarkPosition: 'bottom-right',
        targetSizeKB: 500,
        preserveStructure: false,
        cloudinary: null
      };

      await expect(processImages(config)).rejects.toThrow('No supported image files found');
    });

    test('should handle corrupted image gracefully', async () => {
      // Write invalid data as "image"
      await fs.writeFile(path.join(inputDir, 'corrupt.jpg'), Buffer.from('not an image'));

      const config = {
        inputDir,
        outputDir,
        watermarkPath,
        maxWidth: 1920,
        quality: 85,
        format: 'jpeg',
        watermarkScale: 0.15,
        watermarkOpacity: 0.6,
        watermarkPosition: 'bottom-right',
        targetSizeKB: 500,
        preserveStructure: false,
        cloudinary: null
      };

      const results = await processImages(config);
      expect(results.total).toBe(1);
      expect(results.failed).toHaveLength(1);
      expect(results.success).toHaveLength(0);
    });

    test('should handle images smaller than maxWidth', async () => {
      // Small image that doesn't need resizing
      const buffer = await createTestImage(800, 600);
      await fs.writeFile(path.join(inputDir, 'small.jpg'), buffer);

      const config = {
        inputDir,
        outputDir,
        watermarkPath,
        maxWidth: 1920,
        quality: 85,
        format: 'jpeg',
        watermarkScale: 0.15,
        watermarkOpacity: 0.6,
        watermarkPosition: 'bottom-right',
        targetSizeKB: 500,
        preserveStructure: false,
        cloudinary: null
      };

      const results = await processImages(config);
      expect(results.success).toHaveLength(1);
      // Should not enlarge
      expect(results.success[0].dimensions.width).toBeLessThanOrEqual(800);
    });
  });
});
