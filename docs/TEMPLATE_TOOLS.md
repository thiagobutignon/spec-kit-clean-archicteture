# Template Tools Documentation

## Overview

This project includes powerful tools for managing and validating Clean Architecture templates:

1. **Universal YAML Validator** - Validates any template against a unified schema
2. **YAML to Markdown Converter** - Converts templates to readable documentation

## 🎯 Universal Template Validator

### Purpose
A single validator that works with ALL template types, ensuring consistency across the project.

### Usage

#### Validate a single template:
```bash
npm run templates:validate templates/DOMAIN_TEMPLATE.yaml
```

#### Validate all templates:
```bash
npm run templates:validate-all
```

#### Direct CLI usage:
```bash
npx tsx src/schemas/validate-any-template.ts templates/DATA_TEMPLATE.yaml
```

### Features

- ✅ **Universal Schema** - Works with domain, data, and generic templates
- ✅ **Quality Score** - Rates templates from 0-100
- ✅ **Type Detection** - Automatically identifies template type
- ✅ **Placeholder Analysis** - Finds and categorizes all placeholders
- ✅ **Workflow Validation** - Ensures correct step order
- ✅ **Architecture Checking** - Validates dependency rules
- ✅ **Improvement Suggestions** - Provides actionable feedback

### Quality Score Breakdown

| Category | Max Points | What's Evaluated |
|----------|-----------|------------------|
| Structure | 20 | Folder structure and organization |
| Documentation | 20 | Ubiquitous language, AI guidelines |
| Workflow | 20 | Step order (branch → folders → files → PR) |
| Architecture | 20 | Dependency rules and principles |
| Guidelines | 20 | Troubleshooting, refactoring, recovery |

### Schema Location
- **Universal Schema:** `src/schemas/unified-template-schema.ts`
- **Validator CLI:** `src/schemas/validate-any-template.ts`

## 📝 YAML to Markdown Converter

### Purpose
Converts YAML templates to Markdown with frontmatter for better readability and documentation.

### Usage

#### Convert all templates:
```bash
npm run templates:to-markdown
```

#### Convert a single template:
```bash
npx tsx src/tools/yaml-to-markdown.ts templates/DOMAIN_TEMPLATE.yaml docs/templates/
```

#### Convert with custom output:
```bash
npx tsx src/tools/yaml-to-markdown.ts [input] [output-dir]
```

### Features

- ✅ **Frontmatter** - Preserves metadata in YAML frontmatter
- ✅ **Syntax Highlighting** - Proper code blocks with language detection
- ✅ **Table of Contents** - Auto-generated navigation
- ✅ **Collapsible Sections** - Validation scripts in `<details>` tags
- ✅ **Formatted Tables** - Ubiquitous language as markdown tables
- ✅ **Step Numbering** - Clear step progression
- ✅ **GitHub Ready** - Renders perfectly on GitHub

### Output Structure

Each Markdown file includes:

```markdown
---
title: "Template Title"
version: "3.0.0"
layers: [domain]
template_type: domain
---

# Template Title

## Table of Contents

## Overview

## Architecture

## Structure

## Implementation Steps

## Rules & Guidelines

## Troubleshooting

## AI Guidelines
```

### Converter Location
- **Script:** `src/tools/yaml-to-markdown.ts`
- **Output:** `docs/templates/`

## 🚀 NPM Scripts

Add these to your workflow:

```json
{
  "scripts": {
    "templates:validate": "tsx src/schemas/validate-any-template.ts",
    "templates:to-markdown": "tsx src/tools/yaml-to-markdown.ts templates/ docs/templates/",
    "templates:validate-all": "for f in templates/*.yaml; do echo \"Validating $f...\"; tsx src/schemas/validate-any-template.ts \"$f\" || exit 1; done"
  }
}
```

## 📊 Current Template Status

| Template | Validation | Quality Score | Markdown |
|----------|------------|---------------|----------|
| DOMAIN_TEMPLATE.yaml | ✅ PASSED | 100/100 | ✅ Generated |
| DATA_TEMPLATE.yaml | ✅ PASSED | 100/100 | ✅ Generated |
| TEMPLATE.yaml | ✅ PASSED | 100/100 | ✅ Generated |
| TEMPLATE_REFACTORED.yaml | ✅ PASSED | 80/100 | ✅ Generated |
| DATA_TEMPLATE_REFACTORED.yaml | ✅ PASSED | 100/100 | ✅ Generated |

## 🎨 Template Standards

All templates must:

1. **Include Required Fields:**
   - `version` - Semantic versioning
   - `metadata.layers` - Architectural layers affected
   - `steps` - Implementation steps array

2. **Follow Workflow Order:**
   - First step: Branch creation
   - Middle steps: Folders, files, refactoring
   - Last step: Pull request

3. **Apply DRY Principles:**
   - Use YAML anchors for repeated content
   - Define `step_defaults` for common properties
   - Create reusable `validation_scripts`

4. **Include Architecture:**
   - Dependency rules
   - Architecture principles
   - Layer responsibilities

## 🔧 Troubleshooting

### Validation Fails

If a template fails validation:

1. Check for missing `metadata.layers` field
2. Verify version format (`x.y.z`)
3. Ensure steps array is not empty
4. Add missing architecture section

### Conversion Issues

If conversion fails:

1. Ensure YAML is valid (no syntax errors)
2. Check YAML anchors are properly defined
3. Verify file permissions
4. Create output directory if missing

## 📚 Related Documentation

- [Template Validation Report](../TEMPLATE_VALIDATION_REPORT.md)
- [Markdown Templates](./templates/)
- [Schema Documentation](../src/schemas/README.md)

## 🤝 Contributing

When creating new templates:

1. Start from an existing template
2. Validate with `npm run templates:validate`
3. Convert to Markdown with `npm run templates:to-markdown`
4. Aim for 100/100 quality score
5. Document any new placeholders