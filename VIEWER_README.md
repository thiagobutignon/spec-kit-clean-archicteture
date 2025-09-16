# Domain Template Viewer

## 🎯 Overview

Interactive HTML viewer for Domain Template YAML files with syntax highlighting and organized sections.

## 🚀 Quick Start

1. **Start the server:**
   ```bash
   python3 -m http.server 8080
   ```

2. **Open in browser:**
   ```
   http://localhost:8080
   ```

3. **The viewer will automatically load `DOMAIN_TEMPLATE.yaml`**

## ✨ Features

### 📑 Tabbed Interface
- **📁 Structure**: View project folder structure
- **🔗 Dependencies**: Layer dependency rules
- **📋 Rules**: Domain layer allowed/forbidden items
- **⚙️ Use Cases**: Templates and validation scripts
- **⚠️ Errors**: Domain error patterns
- **🧪 Test Helpers**: Mock templates with Vitest
- **🔧 Troubleshooting**: Solutions for common problems
- **♻️ Refactoring**: Scripts and examples
- **🤖 AI Guidelines**: Rules for code generation

### 🎨 Visual Features
- **Dark theme** optimized for code reading
- **Syntax highlighting** for TypeScript, Bash, and YAML
- **Copy buttons** for all code snippets
- **Accordions** for organized content
- **Color-coded rules**:
  - ✅ Green for allowed/should
  - ❌ Red for forbidden/should not
  - ⚠️ Yellow for warnings
  - 🔵 Blue for informational

### 📱 Responsive Design
- Works on desktop and mobile
- Touch-friendly accordions
- Scrollable tabs on small screens

## 🔧 Customization

To load a different YAML file:
1. Enter the filename in the input field
2. Click "Load Template"
3. The viewer will refresh with the new content

## 📋 Requirements

- Modern browser with JavaScript enabled
- Python 3 for local server (or any HTTP server)
- YAML files must be in the same directory

## 🏗️ Structure

```
index.html          # Single-file viewer with embedded CSS/JS
DOMAIN_TEMPLATE.yaml    # Default template file
validate-domain-template.ts  # TypeScript validator
test-validator.js      # Simple JS validator
```

## 🛠️ Technologies Used

- **js-yaml**: YAML parsing in browser
- **Prism.js**: Syntax highlighting
- **Vanilla JavaScript**: No framework dependencies
- **CSS3**: Modern styling with variables
- **HTML5**: Semantic markup

## 📝 Notes

- All CSS and JavaScript are embedded in `index.html` for portability
- No build process required
- Works offline (except CDN dependencies)
- Supports any valid Domain Template YAML structure