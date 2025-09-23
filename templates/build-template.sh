#!/bin/bash

# Build Template Script
# Combines all .part.regent files from subdirectories into complete template files

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
PARTS_DIR="templates/parts"
OUTPUT_DIR="templates"
TEMP_FILE="templates/.template.tmp"

# Target types
TARGETS=("backend" "frontend" "fullstack")

echo -e "${YELLOW}Building templates from modular parts...${NC}"

# Check if parts directory exists
if [ ! -d "$PARTS_DIR" ]; then
    echo -e "${RED}Error: Parts directory not found at $PARTS_DIR${NC}"
    exit 1
fi

# Function to build a template for a specific target
build_template() {
    local TARGET=$1
    local OUTPUT_FILE="${OUTPUT_DIR}/${TARGET}-template.regent"
    local TEMP_FILE="${OUTPUT_DIR}/.${TARGET}-template.tmp"
    local PART_COUNT=0

    echo -e "${BLUE}Building ${TARGET} template...${NC}"

    # Create temporary file
    > "$TEMP_FILE"

    # Add build header
    echo "# =============================================" >> "$TEMP_FILE"
    echo "# GENERATED FILE - DO NOT EDIT DIRECTLY" >> "$TEMP_FILE"
    echo "# Target: ${TARGET}" >> "$TEMP_FILE"
    echo "# Built from parts in $PARTS_DIR" >> "$TEMP_FILE"
    echo "# Generated at: $(date '+%Y-%m-%d %H:%M:%S')" >> "$TEMP_FILE"
    echo "# To modify, edit the part files and rebuild" >> "$TEMP_FILE"
    echo "# =============================================" >> "$TEMP_FILE"
    echo "" >> "$TEMP_FILE"

    # First add shared parts (like header)
    if [ -d "$PARTS_DIR/shared" ]; then
        for part in $PARTS_DIR/shared/*.part.regent; do
            if [ -f "$part" ]; then
                filename=$(basename "$part")
                echo -e "${GREEN}  ✓ Adding shared: $filename${NC}"

                echo "" >> "$TEMP_FILE"
                echo "# --- From: shared/$filename ---" >> "$TEMP_FILE"

                # Remove section markers if they exist
                sed '/^# ============= BEGIN .* SECTION =============/d; /^# ============= END .* SECTION =============/d' "$part" >> "$TEMP_FILE"

                echo "" >> "$TEMP_FILE"
                PART_COUNT=$((PART_COUNT + 1))
            fi
        done
    fi

    # Then add target-specific parts
    if [ -d "$PARTS_DIR/$TARGET" ]; then
        for part in $PARTS_DIR/$TARGET/*.part.regent; do
            if [ -f "$part" ]; then
                filename=$(basename "$part")
                echo -e "${GREEN}  ✓ Adding ${TARGET}: $filename${NC}"

                echo "" >> "$TEMP_FILE"
                echo "# --- From: ${TARGET}/$filename ---" >> "$TEMP_FILE"

                # Remove section markers if they exist
                sed '/^# ============= BEGIN .* =============/d; /^# ============= END .* =============/d' "$part" >> "$TEMP_FILE"

                echo "" >> "$TEMP_FILE"
                PART_COUNT=$((PART_COUNT + 1))
            fi
        done
    else
        echo -e "${YELLOW}  ⚠ No parts found for ${TARGET}${NC}"
    fi

    # Move temp file to final location if we have parts
    if [ $PART_COUNT -gt 0 ]; then
        mv "$TEMP_FILE" "$OUTPUT_FILE"
        echo -e "${GREEN}  ✓ Built ${TARGET} template from $PART_COUNT parts${NC}"
        echo -e "${GREEN}    Output: $OUTPUT_FILE${NC}"
    else
        rm -f "$TEMP_FILE"
        echo -e "${RED}  ✗ No parts found for ${TARGET} template${NC}"
    fi
}

# Build templates for each target
for TARGET in "${TARGETS[@]}"; do
    build_template "$TARGET"
    echo ""
done

# Also build a combined template if needed
echo -e "${BLUE}Building combined template...${NC}"
COMBINED_OUTPUT="${OUTPUT_DIR}/template.regent"
COMBINED_TEMP="${OUTPUT_DIR}/.template.tmp"
TOTAL_PARTS=0

> "$COMBINED_TEMP"

# Add header for combined
echo "# =============================================" >> "$COMBINED_TEMP"
echo "# GENERATED FILE - DO NOT EDIT DIRECTLY" >> "$COMBINED_TEMP"
echo "# Combined template (backend + frontend)" >> "$COMBINED_TEMP"
echo "# Built from parts in $PARTS_DIR" >> "$COMBINED_TEMP"
echo "# Generated at: $(date '+%Y-%m-%d %H:%M:%S')" >> "$COMBINED_TEMP"
echo "# =============================================" >> "$COMBINED_TEMP"
echo "" >> "$COMBINED_TEMP"

# Add all parts from all directories (excluding fullstack from combined)
# Combined template only includes backend and frontend, not fullstack
for dir in shared backend frontend; do
    if [ -d "$PARTS_DIR/$dir" ]; then
        for part in $PARTS_DIR/$dir/*.part.regent; do
            if [ -f "$part" ]; then
                filename=$(basename "$part")
                echo -e "${GREEN}  ✓ Adding $dir/$filename${NC}"

                echo "" >> "$COMBINED_TEMP"
                echo "# --- From: $dir/$filename ---" >> "$COMBINED_TEMP"

                sed '/^# ============= BEGIN .* =============/d; /^# ============= END .* =============/d' "$part" >> "$COMBINED_TEMP"

                echo "" >> "$COMBINED_TEMP"
                TOTAL_PARTS=$((TOTAL_PARTS + 1))
            fi
        done
    fi
done

if [ $TOTAL_PARTS -gt 0 ]; then
    mv "$COMBINED_TEMP" "$COMBINED_OUTPUT"
    echo -e "${GREEN}✓ Built combined template from $TOTAL_PARTS parts${NC}"
    echo -e "${GREEN}  Output: $COMBINED_OUTPUT${NC}"
else
    rm -f "$COMBINED_TEMP"
fi

echo ""

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