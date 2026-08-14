# 🦁 Safari Image Optimizer

A CLI tool to batch-process high-resolution safari/wildlife images (4–8MB) into web-optimized, watermarked assets ready for Being used in deployment i.e cloudinary cdn.

## Features

- **Batch processing** — handles entire directories recursively
- **Smart resize** — scales down to web-friendly dimensions (default 1920px width)
- **Aggressive compression** — targets ~500KB per image with auto quality fallback
- **Watermark overlay** — adds your org logo with configurable position, size, and opacity
- **Format conversion** — JPEG, WebP, or AVIF output
- **Cloudinary upload** — one-command deploy to your Cloudinary account
- **SEO-ready** — auto-tags and contextual metadata on upload
- **Preserves structure** — optional folder hierarchy preservation

## Install

```bash
npm install
# or globally
npm link
```

## Quick Start

### 1. Prepare your watermark
Create a **PNG with transparency** of your organization logo. Recommended: 500–1000px wide, transparent background.

### 2. Optimize only (no upload)

```bash
node bin/safari-opt.js optimize \
  -i ./raw-safari-images \
  -o ./optimized \
  -w ./logo.png \
  --width 1920 \
  --quality 85 \
  --format jpeg \
  --target-size 500
```

### 3. Optimize + upload to Cloudinary

```bash
node bin/safari-opt.js optimize \
  -i ./raw-safari-images \
  -o ./optimized \
  -w ./logo.png \
  --width 1920 \
  --quality 85 \
  --cloudinary \
  --cloud-name your_cloud_name \
  --api-key your_api_key \
  --api-secret your_api_secret \
  --cloud-folder safari-2026
```

Or use environment variables:

```bash
export CLOUDINARY_CLOUD_NAME=your_cloud_name
export CLOUDINARY_API_KEY=your_api_key
export CLOUDINARY_API_SECRET=your_api_secret

node bin/safari-opt.js optimize -i ./raw -o ./out -w ./logo.png --cloudinary
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `-i, --input <path>` | Input directory with raw images | **required** |
| `-o, --output <path>` | Output directory for optimized images | **required** |
| `-w, --watermark <path>` | Path to watermark PNG | **required** |
| `--width <number>` | Max width in pixels | `1920` |
| `--quality <number>` | Initial JPEG/WebP/AVIF quality (1–100) | `85` |
| `--format <type>` | Output format: `jpeg`, `webp`, `avif` | `jpeg` |
| `--watermark-scale <number>` | Watermark width as % of image width | `15` |
| `--watermark-opacity <number>` | Watermark opacity (0.0–1.0) | `0.6` |
| `--watermark-position <pos>` | `center`, `top-left`, `top-right`, `bottom-left`, `bottom-right` | `bottom-right` |
| `--target-size <kb>` | Target max file size in KB (auto-reduces quality if exceeded) | `500` |
| `--preserve-structure` | Keep subdirectory structure in output | `false` |
| `--cloudinary` | Enable Cloudinary upload | `false` |
| `--cloud-folder <folder>` | Cloudinary destination folder | `safari-optimized` |

## Example Output

```
🦁 Safari Image Optimizer

📁 Found 47 image(s) to process
🎯 Target: max 1920px width, ~500KB, JPEG, 85% quality
💧 Watermark: bottom-right, 15% width, 60% opacity

   ████████████████████████████████████████ 100% | 47/47 images | IMG_2047.jpg

✅ Done!

   Total processed: 47
   Successful: 47
   Failed: 0

   Size reduction: 312.4MB → 18,245KB (94.3% saved)

☁️  Uploading to Cloudinary...

   [1/47] Uploading IMG_2047... ✓ https://res.cloudinary.com/.../safari-2026/IMG_2047.jpg
   ...

   Uploaded: 47, Failed: 0
```

## Supported Input Formats

JPEG, PNG, TIFF, WebP, AVIF, HEIC

## Why This Works for Safari Images

Safari cameras (especially DSLRs/mirrorless) produce 4–8MB JPEGs at 4000–6000px wide. For web use:
- **1920px width** is plenty for full-width hero images
- **85% quality** with `mozjpeg` keeps details while crushing file size
- **Auto quality fallback** drops quality by 5% increments if the target size is exceeded
- **Progressive JPEG** improves perceived load speed

## License

MIT
