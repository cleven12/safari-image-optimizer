# 🦁 Safari Image Optimizer

[![npm version](https://badge.fury.io/js/safari-image-optimizer.svg)](https://www.npmjs.com/package/safari-image-optimizer)
[![CI](https://github.com/cleven12/safari-image-optimizer/actions/workflows/ci.yml/badge.svg)](https://github.com/cleven12/safari-image-optimizer/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/cleven12/safari-image-optimizer/branch/main/graph/badge.svg)](https://codecov.io/gh/cleven12/safari-image-optimizer)
[![CodeQL](https://github.com/cleven12/safari-image-optimizer/actions/workflows/codeql.yml/badge.svg)](https://github.com/cleven12/safari-image-optimizer/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/safari-image-optimizer)](https://nodejs.org/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

> Batch optimize safari/wildlife images (4–8MB) into web-ready, watermarked assets — with one-command Cloudinary deployment.

Built for safari operators, wildlife photographers, and conservation orgs who need to process hundreds of high-res images for web galleries, CMS uploads, and SEO-optimized delivery.

## ✨ Features

- **🖼️ Batch Processing** — recursively handles entire directories of raw safari images
- **📐 Smart Resize** — scales 4000–6000px images down to web-friendly dimensions (default 1920px)
- **🗜️ Aggressive Compression** — targets ~500KB per image with automatic quality fallback
- **💧 Watermark Overlay** — adds your org logo with 5 positions, configurable size & opacity
- **🔄 Format Conversion** — output as JPEG (progressive), WebP, or AVIF
- **☁️ Cloudinary Upload** — one-command deploy with SEO metadata and auto-tagging
- **📁 Structure Preservation** — optional folder hierarchy retention
- **🧪 Tested** — 70%+ coverage with unit, integration, and CLI tests
- **🚀 CI/CD Ready** — GitHub Actions, Dependabot, CodeQL, automated releases

## 📦 Install

### Global (recommended)

```bash
npm install -g safari-image-optimizer
```

### Local project

```bash
npm install --save-dev safari-image-optimizer
npx safari-opt --help
```

### From source

```bash
git clone https://github.com/cleven12/safari-image-optimizer.git
cd safari-image-optimizer
npm install
npm link
```

## 🚀 Quick Start

### 1. Prepare your watermark

Create a **PNG with transparency** of your organization logo.

**Recommended specs:**
- Format: PNG with alpha channel
- Size: 500–1000px wide
- Background: transparent

### 2. Optimize only (dry run)

```bash
safari-opt optimize \
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
export CLOUDINARY_CLOUD_NAME=your_cloud_name
export CLOUDINARY_API_KEY=your_api_key
export CLOUDINARY_API_SECRET=your_api_secret

safari-opt optimize \
  -i ./raw-safari-images \
  -o ./optimized \
  -w ./logo.png \
  --width 1920 \
  --quality 85 \
  --cloudinary \
  --cloud-folder safari-2026
```

Or pass credentials inline:

```bash
safari-opt optimize \
  -i ./raw \
  -o ./out \
  -w ./logo.png \
  --cloudinary \
  --cloud-name your_cloud_name \
  --api-key your_api_key \
  --api-secret your_api_secret \
  --cloud-folder safari-2026
```

## 📋 Options

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
| `--target-size <kb>` | Target max file size in KB (auto-reduces quality) | `500` |
| `--preserve-structure` | Keep subdirectory structure in output | `false` |
| `--cloudinary` | Enable Cloudinary upload | `false` |
| `--cloud-folder <folder>` | Cloudinary destination folder | `safari-optimized` |

## 📊 Example Output

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

## 🐳 Docker

```bash
# Build
docker build -t safari-opt .

# Run
docker run -v $(pwd)/raw:/input -v $(pwd)/out:/output -v $(pwd)/logo.png:/watermark.png \
  safari-opt optimize -i /input -o /output -w /watermark.png --width 1920
```

## 🧪 Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:ci

# Watch mode
npm run test:watch

# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check

# Release (maintainers only)
npm run release
```

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   CLI Input     │────▶│  Image Processor │────▶│  Cloudinary     │
│  (Commander.js) │     │    (Sharp/libvips)│    │    Upload       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
   -i ./raw                Resize 1920px            SEO metadata
   -o ./out                Compress 85%             Auto-tags
   -w logo.png             Watermark overlay        Folder structure
   --format webp            Quality fallback        Public URLs
```

## 📁 Supported Formats

**Input:** JPEG, PNG, TIFF, WebP, AVIF, HEIC  
**Output:** JPEG (progressive), WebP, AVIF

## 🔧 Why This Works for Safari Images

Safari cameras (DSLRs, mirrorless, even modern smartphones) produce 4–8MB JPEGs at 4000–6000px. For web use:

| Problem | Solution |
|---------|----------|
| **Too large** | Resize to 1920px max — plenty for full-width hero images |
| **Slow loading** | Progressive JPEG + mozjpeg keeps quality while crushing size |
| **Complex scenes** | Auto quality fallback drops by 5% increments until target size is met |
| **Brand protection** | Watermark scales with image (15% width) — consistent across orientations |
| **SEO** | Cloudinary upload includes `alt` text, `source` context, and auto-tags |

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, commit conventions, and release process.

## 📄 License

[MIT](LICENSE) © Cleven Godson

## 🙏 Acknowledgments

- [Sharp](https://sharp.pixelplumbing.com/) — High-performance image processing
- [libvips](https://www.libvips.org/) — Underlying image processing library
- [Cloudinary](https://cloudinary.com/) — Image hosting and delivery
- [Commander.js](https://github.com/tj/commander.js/) — CLI framework
