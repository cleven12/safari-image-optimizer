const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

const CLI_PATH = path.resolve(__dirname, '../bin/safari-opt.js');

// Helper to run CLI commands
function runCLI(args, options = {}) {
  const cmd = `node "${CLI_PATH}" ${args}`;
  return execSync(cmd, {
    encoding: 'utf-8',
    cwd: path.resolve(__dirname, '..'),
    ...options
  });
}

// Helper to create test image
async function createTestImage(filePath, width = 2000, height = 1500) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const buffer = await sharp({
    create: { width, height, channels: 3, background: '#2d5a27' }
  }).jpeg({ quality: 90 }).toBuffer();
  await fs.writeFile(filePath, buffer);
}

// Helper to create test watermark
async function createTestWatermark(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const buffer = await sharp({
    create: { width: 200, height: 50, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0.8 } }
  }).png().toBuffer();
  await fs.writeFile(filePath, buffer);
}

describe('CLI Integration', () => {
  let tempDir;
  let inputDir;
  let outputDir;
  let watermarkPath;

  beforeEach(async () => {
    tempDir = path.join(__dirname, 'temp-cli', `test-${Date.now()}`);
    inputDir = path.join(tempDir, 'input');
    outputDir = path.join(tempDir, 'output');
    watermarkPath = path.join(tempDir, 'watermark.png');

    await fs.mkdir(inputDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
    await createTestWatermark(watermarkPath);
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  describe('Help and version', () => {
    test('should display version', () => {
      const output = runCLI('--version');
      expect(output).toMatch(/\d+\.\d+\.\d+/);
    });

    test('should display help', () => {
      const output = runCLI('--help');
      expect(output).toContain('safari-opt');
      expect(output).toContain('optimize');
      expect(output).toContain('config');
    });

    test('should display config help', () => {
      const output = runCLI('config');
      expect(output).toContain('CLOUDINARY_CLOUD_NAME');
      expect(output).toContain('CLOUDINARY_API_KEY');
    });
  });

  describe('Optimize command', () => {
    test('should optimize a single image', async () => {
      await createTestImage(path.join(inputDir, 'lion.jpg'), 3000, 2000);

      const output = runCLI(
        `optimize -i "${inputDir}" -o "${outputDir}" -w "${watermarkPath}" --width 1600 --quality 80 --target-size 400`
      );

      expect(output).toContain('Done!');
      expect(output).toContain('Successful: 1');

      // Verify output exists
      const files = await fs.readdir(outputDir);
      expect(files).toContain('lion.jpg');
    });

    test('should optimize multiple images', async () => {
      await createTestImage(path.join(inputDir, 'lion.jpg'), 3000, 2000);
      await createTestImage(path.join(inputDir, 'elephant.jpg'), 3500, 2333);
      await createTestImage(path.join(inputDir, 'zebra.jpg'), 2800, 1867);

      const output = runCLI(
        `optimize -i "${inputDir}" -o "${outputDir}" -w "${watermarkPath}" --width 1920`
      );

      expect(output).toContain('Found 3 image(s)');
      expect(output).toContain('Successful: 3');

      const files = await fs.readdir(outputDir);
      expect(files).toHaveLength(3);
    });

    test('should handle missing input directory', () => {
      expect(() => {
        runCLI(`optimize -i "${tempDir}/nonexistent" -o "${outputDir}" -w "${watermarkPath}"`);
      }).toThrow();
    });

    test('should handle missing watermark', async () => {
      await createTestImage(path.join(inputDir, 'test.jpg'));

      expect(() => {
        runCLI(`optimize -i "${inputDir}" -o "${outputDir}" -w "${tempDir}/no-watermark.png"`);
      }).toThrow();
    });

    test('should output WebP format', async () => {
      await createTestImage(path.join(inputDir, 'test.jpg'), 2000, 1500);

      runCLI(
        `optimize -i "${inputDir}" -o "${outputDir}" -w "${watermarkPath}" --format webp`
      );

      const files = await fs.readdir(outputDir);
      expect(files[0]).toMatch(/\.webp$/);
    });

    test('should preserve directory structure', async () => {
      const subDir = path.join(inputDir, 'day1', 'morning');
      await fs.mkdir(subDir, { recursive: true });
      await createTestImage(path.join(subDir, 'lion.jpg'), 2000, 1500);

      runCLI(
        `optimize -i "${inputDir}" -o "${outputDir}" -w "${watermarkPath}" --preserve-structure`
      );

      const nestedPath = path.join(outputDir, 'day1', 'morning', 'lion.jpg');
      const exists = await fs.access(nestedPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('Error handling', () => {
    test('should show error for empty input directory', async () => {
      expect(() => {
        runCLI(`optimize -i "${inputDir}" -o "${outputDir}" -w "${watermarkPath}"`);
      }).toThrow('No supported image files found');
    });
  });
});
