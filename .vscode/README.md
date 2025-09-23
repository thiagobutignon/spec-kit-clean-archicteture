# VS Code Configuration

This directory contains project-specific VS Code settings that are **intentionally committed** to the repository.

## Included Files

### settings.json
This file provides important project-wide configurations:

1. **File Associations**: Associates `.regent` files with YAML syntax highlighting
2. **Schema Validation**: Automatically validates `.regent` files against `regent.schema.json`
3. **Spell Check**: Adds project-specific terms to the dictionary (e.g., "RLHF")

## Why These Settings Are Committed

These settings ensure consistent development experience across the team:
- All developers get proper syntax highlighting for `.regent` files
- Automatic schema validation helps catch errors early
- Shared spell-check dictionary prevents false positives

## Note for Developers

These settings are project-specific and should be preserved. Personal VS Code preferences should be kept in your user settings, not in this directory.