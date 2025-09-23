# Template Parts Directory

This directory contains modular parts of the regent template system that are combined to create complete templates.

## Directory Structure

```
templates/parts/
├── README.md                         # This file
├── 00-header.part.regent            # Header section with version and metadata
├── 00-header.part.schema.json       # Schema validation for header part
├── 01-structure.part.regent         # (Future) Structure section
├── 01-structure.part.schema.json    # (Future) Schema for structure
├── 02-architecture.part.regent      # (Future) Architecture section
├── 02-architecture.part.schema.json # (Future) Schema for architecture
├── 03-rules.part.regent            # (Future) Rules section
├── 03-rules.part.schema.json       # (Future) Schema for rules
├── 04-steps.part.regent            # (Future) Steps section
├── 04-steps.part.schema.json       # (Future) Schema for steps
├── 05-troubleshooting.part.regent  # (Future) Troubleshooting section
├── 06-refactoring.part.regent      # (Future) Refactoring section
├── 07-learning.part.regent         # (Future) Learning patterns section
├── 08-evaluation.part.regent       # (Future) Evaluation section
├── backend/                         # Backend-specific template parts
└── frontend/                        # Frontend-specific template parts
```

## Naming Convention

### Part Files
- Format: `NN-section-name.part.regent`
- `NN` = Two-digit number indicating order (00-99)
- `section-name` = Descriptive name of the section in kebab-case
- Extension: `.part.regent` for all template parts

### Schema Files
- Format: `NN-section-name.part.schema.json`
- Must match the corresponding part file name
- Provides validation rules specific to that section

## How Parts are Combined

Parts are combined in numerical order to create the complete template:

```bash
# Use the build script to combine all parts
./build-template.sh

# Or manually concatenate (temporary solution)
cat templates/parts/*.part.regent > templates/template.regent
```

## Schema Validation Strategy

Each part has its own schema that validates only the properties relevant to that section:

1. **Specific Schemas**: Each part file has a corresponding `.part.schema.json` file
2. **Flexible Validation**: Part schemas only validate their specific properties
3. **Complete Validation**: The full `regent.schema.json` validates the combined template

## Section Markers

Each part file should include clear section markers:

```yaml
# ============= BEGIN SECTION_NAME SECTION =============
# section content here
# ============= END SECTION_NAME SECTION =============
```

## Adding a New Part

1. Create the part file: `NN-section.part.regent`
2. Create the schema: `NN-section.part.schema.json`
3. Add section markers in the part file
4. Update this README with the new part
5. Test the part individually
6. Run the build script to combine all parts
7. Validate the complete template

## Versioning Strategy

- **Individual Parts**: Not versioned separately
- **Complete Template**: Uses semantic versioning (e.g., 3.0.0)
- **Breaking Changes**: Increment major version when parts structure changes
- **New Features**: Increment minor version when adding new optional parts
- **Bug Fixes**: Increment patch version for fixes within existing parts

## Benefits of Modularization

1. **Better Maintainability**: Easier to find and edit specific sections
2. **Reduced Merge Conflicts**: Changes to different parts don't conflict
3. **Parallel Development**: Multiple developers can work on different parts
4. **Selective Loading**: Future capability to load only needed parts
5. **Clear Organization**: Each part has a single responsibility
6. **Easier Testing**: Parts can be validated independently

## Future Enhancements

- [ ] Automated build pipeline with validation
- [ ] Part dependency management
- [ ] Conditional part inclusion based on configuration
- [ ] Part versioning for backward compatibility
- [ ] Template composition from selected parts
- [ ] Part inheritance for shared configurations