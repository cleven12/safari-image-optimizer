# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-08-14

### Added
- Initial release of Safari Image Optimizer
- Batch image processing with Sharp (libvips)
- Smart resize to configurable max width (default 1920px)
- Aggressive compression targeting ~500KB with auto quality fallback
- Watermark overlay with configurable position, scale, and opacity
- Support for JPEG, WebP, and AVIF output formats
- Cloudinary upload integration with SEO metadata and tags
- Directory structure preservation option
- CLI with Commander.js
- Full test suite with Jest (unit + integration)
- CI/CD with GitHub Actions (test, lint, release, CodeQL, stale bot)
- Dependabot for automated dependency updates
- ESLint + Prettier + Husky pre-commit hooks
- MIT License

### Features
- Progressive JPEG output with mozjpeg optimization
- Recursive directory scanning
- Multi-format input support (JPEG, PNG, TIFF, WebP, AVIF, HEIC)
- 5 watermark positions: center, top-left, top-right, bottom-left, bottom-right
- Environment variable support for Cloudinary credentials
- Progress bar for batch operations
- Detailed size reduction reporting
