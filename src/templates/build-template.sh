#!/bin/bash

# Build Template Script
# Generates layer-specific templates by combining parts in the correct order
# Output format: [backend|frontend|fullstack]-[layer]-template.regent

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Paths (relative to script location)
PARTS_DIR="$SCRIPT_DIR/parts"
OUTPUT_DIR="$SCRIPT_DIR"

# Target types and layers
TARGETS=("backend" "frontend" "fullstack")
LAYERS=("domain" "data" "infra" "presentation" "main")

echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Building Layer-Specific Templates                 ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if parts directory exists
if [ ! -d "$PARTS_DIR" ]; then
    echo -e "${RED}Error: Parts directory not found at $PARTS_DIR${NC}"
    exit 1
fi

# Function to check if file exists and add to template
add_part_if_exists() {
    local part_path=$1
    local temp_file=$2
    local description=$3

    if [ -f "$part_path" ]; then
        echo -e "${GREEN}  ✓ Adding ${description}${NC}"

        echo "" >> "$temp_file"
        echo "# --- From: ${part_path#$PARTS_DIR/} ---" >> "$temp_file"

        # Remove section markers if they exist
        sed '/^# ============= BEGIN .* SECTION =============/d; /^# ============= END .* SECTION =============/d' "$part_path" >> "$temp_file"

        echo "" >> "$temp_file"
        return 0
    else
        echo -e "${YELLOW}  ⚠ Skipping ${description} (not found)${NC}"
        return 1
    fi
}

# Function to build a layer-specific template
build_layer_template() {
    local target=$1
    local layer=$2
    local output_file="${OUTPUT_DIR}/${target}-${layer}-template.regent"
    local temp_file="${OUTPUT_DIR}/.${target}-${layer}-template.tmp"
    local part_count=0

    echo -e "${MAGENTA}Building ${target}/${layer} template...${NC}"

    # Create temporary file
    > "$temp_file"

    # Add build header
    echo "# =============================================" >> "$temp_file"
    echo "# GENERATED FILE - DO NOT EDIT DIRECTLY" >> "$temp_file"
    echo "# Target: ${target}" >> "$temp_file"
    echo "# Layer: ${layer}" >> "$temp_file"
    echo "# Built from parts in $PARTS_DIR" >> "$temp_file"
    echo "# Generated at: $(date '+%Y-%m-%d %H:%M:%S')" >> "$temp_file"
    echo "# To modify, edit the part files and rebuild" >> "$temp_file"
    echo "# =============================================" >> "$temp_file"
    echo "" >> "$temp_file"

    # Step 1: Add shared header (00-header.part.regent)
    if add_part_if_exists "$PARTS_DIR/shared/00-header.part.regent" "$temp_file" "shared header"; then
        part_count=$((part_count + 1))
    fi

    # Step 2: Add target-specific structure, architecture, and rules
    if add_part_if_exists "$PARTS_DIR/$target/01-structure.part.regent" "$temp_file" "$target structure"; then
        part_count=$((part_count + 1))
    fi

    if add_part_if_exists "$PARTS_DIR/$target/02-architecture.part.regent" "$temp_file" "$target architecture"; then
        part_count=$((part_count + 1))
    fi

    if add_part_if_exists "$PARTS_DIR/$target/03-rules.part.regent" "$temp_file" "$target rules"; then
        part_count=$((part_count + 1))
    fi

    # Step 3: Add layer-specific implementation
    local layer_file=""
    case $layer in
        "domain")
            layer_file="01-domain.part.regent"
            ;;
        "data")
            layer_file="02-data.part.regent"
            ;;
        "infra")
            layer_file="03-infra.part.regent"
            ;;
        "presentation")
            layer_file="04-presentation.part.regent"
            ;;
        "main")
            layer_file="05-main.part.regent"
            ;;
    esac

    if add_part_if_exists "$PARTS_DIR/$target/steps/$layer_file" "$temp_file" "$target $layer layer"; then
        part_count=$((part_count + 1))
    fi

    # Step 4: Add shared validation if it's not the main layer (validation is part of presentation)
    if [ "$layer" = "presentation" ] && [ -f "$PARTS_DIR/shared/steps/validation.part.regent" ]; then
        if add_part_if_exists "$PARTS_DIR/shared/steps/validation.part.regent" "$temp_file" "shared validation"; then
            part_count=$((part_count + 1))
        fi
    fi

    # Step 5: Add shared footer (01-footer.part.regent)
    if add_part_if_exists "$PARTS_DIR/shared/01-footer.part.regent" "$temp_file" "shared footer"; then
        part_count=$((part_count + 1))
    fi

    # Move temp file to final location if we have parts
    if [ $part_count -gt 0 ]; then
        mv "$temp_file" "$output_file"
        echo -e "${GREEN}  ✅ Built ${target}-${layer} template from $part_count parts${NC}"
        echo -e "${BLUE}     Output: $output_file${NC}"
        return 0
    else
        rm -f "$temp_file"
        echo -e "${RED}  ❌ No parts found for ${target}-${layer} template${NC}"
        return 1
    fi
}

# Statistics
total_templates=0
failed_templates=0

# Build templates for each target and layer combination
for target in "${TARGETS[@]}"; do
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  Processing ${target} templates${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo ""

    for layer in "${LAYERS[@]}"; do
        if build_layer_template "$target" "$layer"; then
            total_templates=$((total_templates + 1))
        else
            failed_templates=$((failed_templates + 1))
        fi
        echo ""
    done
done

# Summary
echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    Build Summary                      ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $failed_templates -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully built all $total_templates templates!${NC}"
else
    echo -e "${YELLOW}⚠️  Built $total_templates templates with $failed_templates failures${NC}"
fi

echo ""
echo -e "${BLUE}Templates generated:${NC}"
for target in "${TARGETS[@]}"; do
    for layer in "${LAYERS[@]}"; do
        template_file="${OUTPUT_DIR}/${target}-${layer}-template.regent"
        if [ -f "$template_file" ]; then
            size=$(wc -l < "$template_file" | tr -d ' ')
            echo -e "  ${GREEN}✓${NC} ${target}-${layer}-template.regent (${size} lines)"
        fi
    done
done

echo ""

# Optional: Validate YAML syntax if yq is installed
if command -v yq &> /dev/null; then
    echo -e "${YELLOW}Validating YAML syntax...${NC}"
    validation_failed=0

    for target in "${TARGETS[@]}"; do
        for layer in "${LAYERS[@]}"; do
            template_file="${OUTPUT_DIR}/${target}-${layer}-template.regent"
            if [ -f "$template_file" ]; then
                if yq eval '.' "$template_file" > /dev/null 2>&1; then
                    echo -e "  ${GREEN}✓${NC} ${target}-${layer}: Valid YAML"
                else
                    echo -e "  ${RED}✗${NC} ${target}-${layer}: Invalid YAML"
                    validation_failed=$((validation_failed + 1))
                fi
            fi
        done
    done

    if [ $validation_failed -gt 0 ]; then
        echo -e "${RED}⚠️  $validation_failed templates have YAML syntax errors${NC}"
    else
        echo -e "${GREEN}✅ All templates have valid YAML syntax${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️  yq not installed - skipping YAML validation${NC}"
    echo -e "${YELLOW}   Install with: brew install yq (macOS) or apt-get install yq (Linux)${NC}"
fi

echo ""
echo -e "${GREEN}Build complete!${NC}"
echo ""

# Show usage hint
echo -e "${CYAN}Usage hint:${NC}"
echo -e "  To use a specific template, run:"
echo -e "  ${BLUE}npx tsx execute-template.ts templates/[target]-[layer]-template.regent${NC}"
echo -e ""
echo -e "  Example:"
echo -e "  ${BLUE}npx tsx execute-template.ts templates/backend-domain-template.regent${NC}"
echo ""