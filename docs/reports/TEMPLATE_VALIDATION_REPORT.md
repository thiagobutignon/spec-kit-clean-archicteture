# Template Validation Report

## Summary

Tested all 5 template YAML files with the universal validator (`src/schemas/validate-any-template.ts`).

### Results:

| Template | Status | Quality Score | Issues |
|----------|--------|---------------|--------|
| DATA_TEMPLATE_REFACTORED.yaml | ✅ PASSED | 100/100 | None - Excellent template |
| DATA_TEMPLATE.yaml | ✅ PASSED | 100/100 | None - Excellent template |
| TEMPLATE.yaml | ✅ PASSED | 100/100 | None - Excellent template |
| TEMPLATE_REFACTORED.yaml | ✅ PASSED | 80/100 | Missing AI guidelines |
| DOMAIN_TEMPLATE.yaml | ❌ FAILED | N/A | Missing required field: metadata.layers |

## Templates Requiring Adjustment

### 1. DOMAIN_TEMPLATE.yaml
**Status:** FAILED - Cannot validate due to missing required field
**Required Fix:** Add `layers` field to metadata section

The template is missing the required `metadata.layers` field. This field should specify which architectural layers the template affects (e.g., `['domain']`).

### 2. TEMPLATE_REFACTORED.yaml
**Status:** PASSED but could be improved
**Quality Score:** 80/100
**Suggested Improvements:**
- Add AI guidelines section for better code generation

## Conclusion

- **4 out of 5 templates** are working correctly with the universal validator
- **1 template (DOMAIN_TEMPLATE.yaml)** needs adjustment to conform to the standard structure
- All passing templates that include AI guidelines achieve perfect 100/100 scores

## Next Steps

1. Fix DOMAIN_TEMPLATE.yaml by adding the missing `metadata.layers` field
2. Consider adding AI guidelines to TEMPLATE_REFACTORED.yaml to improve its quality score from 80 to 100

## Universal Validator Features

The validator (`src/schemas/validate-any-template.ts`) provides:
- Schema validation against unified template structure
- Quality scoring (0-100)
- Template type detection (domain/data/generic)
- Placeholder analysis and categorization
- Workflow order validation
- Architecture dependency rule checking
- Improvement suggestions
- Color-coded terminal output for better readability