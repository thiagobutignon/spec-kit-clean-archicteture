#!/bin/bash

# Build Template Script
# Combines all .part.regent files into a complete template.regent file

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Paths
PARTS_DIR="templates/parts"
OUTPUT_FILE="templates/template.regent"
TEMP_FILE="templates/.template.tmp"

echo -e "${YELLOW}Building template from parts...${NC}"

# Check if parts directory exists
if [ ! -d "$PARTS_DIR" ]; then
    echo -e "${RED}Error: Parts directory not found at $PARTS_DIR${NC}"
    exit 1
fi

# Check if there are any part files
if ! ls $PARTS_DIR/*.part.regent 1> /dev/null 2>&1; then
    echo -e "${RED}Error: No .part.regent files found in $PARTS_DIR${NC}"
    exit 1
fi

# Create temporary file
> "$TEMP_FILE"

# Add build header
echo "# =============================================" >> "$TEMP_FILE"
echo "# GENERATED FILE - DO NOT EDIT DIRECTLY" >> "$TEMP_FILE"
echo "# Built from parts in $PARTS_DIR" >> "$TEMP_FILE"
echo "# Generated at: $(date '+%Y-%m-%d %H:%M:%S')" >> "$TEMP_FILE"
echo "# To modify, edit the part files and rebuild" >> "$TEMP_FILE"
echo "# =============================================" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# Count parts
PART_COUNT=0

# Combine all parts in numerical order
for part in $PARTS_DIR/*.part.regent; do
    if [ -f "$part" ]; then
        filename=$(basename "$part")
        echo -e "${GREEN}  ✓ Adding $filename${NC}"

        # Add part separator comment
        echo "" >> "$TEMP_FILE"
        echo "# --- From: $filename ---" >> "$TEMP_FILE"

        # Remove section markers if they exist (optional cleanup)
        # This sed command removes the BEGIN and END marker lines
        sed '/^# ============= BEGIN .* SECTION =============/d; /^# ============= END .* SECTION =============/d' "$part" >> "$TEMP_FILE"

        echo "" >> "$TEMP_FILE"
        PART_COUNT=$((PART_COUNT + 1))
    fi
done

# Move temp file to final location
mv "$TEMP_FILE" "$OUTPUT_FILE"

echo -e "${GREEN}✓ Successfully built template from $PART_COUNT parts${NC}"
echo -e "${GREEN}  Output: $OUTPUT_FILE${NC}"

# Validate the generated template if schema exists
if [ -f "regent.schema.json" ]; then
    echo -e "${YELLOW}Validating generated template...${NC}"

    # Check if the YAML is valid (basic check)
    if command -v yq &> /dev/null; then
        if yq eval '.' "$OUTPUT_FILE" > /dev/null 2>&1; then
            echo -e "${GREEN}  ✓ YAML syntax is valid${NC}"
        else
            echo -e "${RED}  ✗ YAML syntax validation failed${NC}"
            echo -e "${YELLOW}  Run 'yq eval . $OUTPUT_FILE' to see errors${NC}"
        fi
    else
        echo -e "${YELLOW}  ⚠ yq not installed - skipping YAML validation${NC}"
        echo -e "${YELLOW}  Install with: brew install yq (macOS) or apt-get install yq (Linux)${NC}"
    fi
fi

echo -e "${GREEN}Build complete!${NC}"