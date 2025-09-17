# Template Documentation

This directory contains Markdown versions of our YAML templates for better readability and documentation.

## Available Templates

### 📘 Domain Layer Template
**File:** [DOMAIN_TEMPLATE.md](./DOMAIN_TEMPLATE.md)
- Clean Architecture domain layer implementation
- Use case interfaces and domain errors
- No external dependencies
- Quality Score: 100/100

### 📗 Data Layer Template
**File:** [DATA_TEMPLATE.md](./DATA_TEMPLATE.md)
- TDD implementation of use cases
- Protocol abstractions
- Spy pattern for testing
- Quality Score: 100/100

### 📙 Generic Template
**File:** [TEMPLATE.md](./TEMPLATE.md)
- Generic Clean Architecture template
- Supports multiple layers
- Flexible structure
- Quality Score: 100/100

## How Templates are Generated

These Markdown files are generated from the YAML templates using the converter script:

```bash
npx tsx src/tools/yaml-to-markdown.ts templates/ docs/templates/
```

## Template Structure

Each Markdown template includes:

1. **Frontmatter** - Metadata about the template
2. **Overview** - Version, source, and ubiquitous language
3. **Architecture** - Dependency rules and principles
4. **Structure** - Folder organization
5. **Implementation Steps** - Detailed steps with code templates
6. **Rules & Guidelines** - Do's and don'ts for each layer
7. **Troubleshooting** - Common issues and solutions
8. **AI Guidelines** - Instructions for AI code generation

## Benefits of Markdown Format

- ✅ **Better readability** - Proper formatting and syntax highlighting
- ✅ **Collapsible sections** - Validation scripts in expandable details
- ✅ **Navigation** - Table of contents for easy navigation
- ✅ **GitHub rendering** - Native rendering in GitHub
- ✅ **Searchable** - Easy to search and reference

## Converting Individual Files

To convert a specific YAML template:

```bash
npx tsx src/tools/yaml-to-markdown.ts templates/DOMAIN_TEMPLATE.yaml docs/templates/
```

## Frontmatter Fields

Each template includes these frontmatter fields:
- `title` - Template title
- `description` - What the template does
- `version` - Semantic version
- `source` - Original YAML file
- `lastUpdated` - Last modification date
- `layers` - Which architectural layers
- `template_type` - domain, data, or generic
- `tdd_principles` - For data layer templates

## Quality Scores

All templates achieve perfect quality scores:
- ✅ Structure (20/20)
- ✅ Documentation (20/20)
- ✅ Workflow (20/20)
- ✅ Architecture (20/20)
- ✅ Guidelines (20/20)

Total: **100/100** 🏆