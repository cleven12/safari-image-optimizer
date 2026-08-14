# Contributing to Safari Image Optimizer

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/cleven12/safari-image-optimizer.git
cd safari-image-optimizer

# Install dependencies
npm install

# Run tests
npm test

# Run linter
npm run lint

# Run formatter
npm run format
```

## Project Structure

```
safari-image-optimizer/
├── bin/               # CLI entry points
│   └── safari-opt.js  # Main CLI
├── lib/               # Core library modules
│   ├── processor.js   # Image processing logic
│   └── uploader.js    # Cloudinary upload logic
├── __tests__/         # Test suites
│   ├── fixtures/      # Test images and data
│   ├── processor.test.js
│   ├── uploader.test.js
│   └── cli.test.js
├── .github/           # GitHub Actions, templates, Dependabot
└── jest.config.js     # Test configuration
```

## Workflow

1. **Fork** the repository
2. **Create a branch** from `main`: `git checkout -b feature/your-feature-name`
3. **Make your changes** with tests
4. **Run the full test suite**: `npm run test:ci`
5. **Ensure code quality**: `npm run lint && npm run format:check`
6. **Commit** with a clear message following [Conventional Commits](https://www.conventionalcommits.org/)
7. **Push** and open a **Pull Request**

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) for automated changelog generation:

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `style:` — Code style changes (formatting, no logic change)
- `refactor:` — Code refactoring
- `perf:` — Performance improvements
- `test:` — Adding or updating tests
- `chore:` — Build process, dependencies, tooling

Example:
```
feat(processor): add AVIF format support

Adds AVIF output format with configurable quality and effort settings.
Includes tests for format conversion and size validation.
```

## Testing Guidelines

- Write tests for all new features and bug fixes
- Maintain or improve code coverage (currently 70% threshold)
- Use descriptive test names: `should [expected behavior] when [condition]`
- Mock external services (Cloudinary) in unit tests
- Include integration tests for CLI commands

## Code Style

- We use **ESLint** and **Prettier** — run `npm run lint:fix` and `npm run format` before committing
- Use `const` and `let` — no `var`
- Prefer async/await over callbacks
- Write JSDoc comments for public functions
- Keep functions focused and small

## Reporting Bugs

Please use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:
- Node.js version and OS
- Input image format and approximate size
- Full error message or stack trace
- Steps to reproduce

## Requesting Features

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) and describe:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

## Release Process

Maintainers handle releases using `standard-version`:

```bash
npm run release        # patch version
npm run release:minor  # minor version
npm run release:major  # major version
```

This will:
1. Bump version in `package.json`
2. Generate `CHANGELOG.md`
3. Create a git tag
4. Push to trigger the release workflow

## Code of Conduct

Be respectful, constructive, and inclusive. Harassment or discriminatory behavior will not be tolerated.

## Questions?

Open a [Discussion](https://github.com/cleven12/safari-image-optimizer/discussions) or reach out via the issue tracker.
