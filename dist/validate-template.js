#!/usr/bin/env tsx
/**
 * Template Validator
 * Validates layer-specific templates against their corresponding JSON schemas
 * Uses the 16 JSON schemas created for each layer/target combination
 */
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
// Using namespace import for native Node.js 'fs' module (not fs-extra)
// This is correct and not affected by the ESM bug - native fs works fine with namespace imports
// Only fs-extra requires default import in ESM/tsx context
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import chalk from 'chalk';
class EnhancedTemplateValidator {
    ajv;
    schemas = new Map();
    layerSchemas = [];
    constructor() {
        // Initialize AJV with comprehensive settings
        this.ajv = new Ajv({
            allErrors: true,
            verbose: true,
            strict: false,
            validateFormats: true,
            coerceTypes: false
        });
        // Add format validators
        addFormats(this.ajv);
        // Initialize layer schema mappings
        this.initializeLayerSchemas();
    }
    /**
     * Initialize mappings between templates and their schemas
     */
    initializeLayerSchemas() {
        const targets = ['backend', 'frontend', 'fullstack'];
        const layers = [
            { name: 'domain', file: '01-domain' },
            { name: 'data', file: '02-data' },
            { name: 'infra', file: '03-infra' },
            { name: 'presentation', file: '04-presentation' },
            { name: 'main', file: '05-main' }
        ];
        targets.forEach(target => {
            layers.forEach(layer => {
                this.layerSchemas.push({
                    target: target,
                    layer: layer.name,
                    schemaPath: `templates/parts/${target}/steps/${layer.file}.part.schema.json`
                });
            });
        });
        // Add shared schemas
        this.layerSchemas.push({
            target: 'backend',
            layer: 'presentation', // Validation is part of presentation
            schemaPath: 'templates/parts/shared/steps/validation.part.schema.json'
        });
    }
    /**
     * Load and compile a schema
     */
    loadSchema(schemaPath) {
        try {
            const absolutePath = path.resolve(schemaPath);
            if (!fs.existsSync(absolutePath)) {
                console.warn(chalk.yellow(`⚠️  Schema not found: ${schemaPath}`));
                return null;
            }
            const schemaContent = fs.readFileSync(absolutePath, 'utf-8');
            const schema = JSON.parse(schemaContent);
            // Compile and cache schema
            const validate = this.ajv.compile(schema);
            const compiledSchema = { schema, validate };
            this.schemas.set(schemaPath, compiledSchema);
            return compiledSchema;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(chalk.red(`❌ Failed to load schema ${schemaPath}: ${message}`));
            return null;
        }
    }
    /**
     * Detect which schema to use based on template file name
     */
    detectSchema(templatePath) {
        const fileName = path.basename(templatePath, '.regent');
        // Parse filename pattern: [target]-[layer]-template
        const match = fileName.match(/^(backend|frontend|fullstack)-(domain|data|infra|presentation|main)-template$/);
        if (!match) {
            return null;
        }
        const [, target, layer] = match;
        return this.layerSchemas.find(ls => ls.target === target && ls.layer === layer) || null;
    }
    /**
     * Validate a template file against its schema
     */
    async validateTemplate(templatePath) {
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            schemaUsed: '',
            layerValidated: '',
            targetValidated: ''
        };
        try {
            // Read template file
            const absolutePath = path.resolve(templatePath);
            const content = fs.readFileSync(absolutePath, 'utf-8');
            const data = yaml.load(content);
            // Detect appropriate schema
            const layerSchema = this.detectSchema(templatePath);
            if (!layerSchema) {
                result.warnings.push('Could not detect layer/target from filename, using generic validation');
                return this.validateGeneric(data, result);
            }
            result.targetValidated = layerSchema.target;
            result.layerValidated = layerSchema.layer;
            result.schemaUsed = layerSchema.schemaPath;
            // Load schema if not cached
            let schemaData = this.schemas.get(layerSchema.schemaPath);
            if (!schemaData) {
                const loadedSchema = this.loadSchema(layerSchema.schemaPath);
                if (!loadedSchema) {
                    result.warnings.push(`Schema ${layerSchema.schemaPath} not available, using generic validation`);
                    return this.validateGeneric(data, result);
                }
                schemaData = loadedSchema;
            }
            // Validate against schema
            const valid = schemaData.validate(data);
            if (!valid) {
                result.valid = false;
                const errors = this.ajv.errors || [];
                errors.forEach(error => {
                    const errorPath = error.instancePath || 'root';
                    const message = `${errorPath}: ${error.message}`;
                    // Add additional context for common errors
                    if (error.keyword === 'required') {
                        result.errors.push(`${message} (missing: ${error.params.missingProperty})`);
                    }
                    else if (error.keyword === 'enum') {
                        result.errors.push(`${message} (allowed: ${error.params.allowedValues?.join(', ')})`);
                    }
                    else {
                        result.errors.push(message);
                    }
                });
            }
            // Layer-specific validations
            this.performLayerSpecificValidations(data, layerSchema, result);
            // Check for common issues
            this.checkCommonIssues(data, result);
            return result;
        }
        catch (error) {
            result.valid = false;
            const message = error instanceof Error ? error.message : String(error);
            result.errors.push(`Failed to validate template: ${message}`);
            return result;
        }
    }
    /**
     * Perform layer-specific validations
     */
    performLayerSpecificValidations(data, layerSchema, result) {
        // Domain layer validations
        if (layerSchema.layer === 'domain') {
            // Check for no external dependencies
            const steps = data.domain_steps || data.steps || [];
            steps.forEach((step) => {
                if (step.template && typeof step.template === 'string') {
                    if (step.template.includes('import axios') ||
                        step.template.includes('import fetch') ||
                        step.template.includes('from prisma')) {
                        result.errors.push(`Domain layer violation in step '${step.id}': External dependencies not allowed`);
                    }
                }
            });
        }
        // Data layer validations
        if (layerSchema.layer === 'data') {
            const steps = data.data_steps || data.steps || [];
            steps.forEach((step) => {
                if (step.type === 'create_file' && !step.template?.includes('implements')) {
                    result.warnings.push(`Step '${step.id}': Data layer should implement domain interfaces`);
                }
            });
        }
        // Infrastructure layer validations
        if (layerSchema.layer === 'infra') {
            const steps = data.infra_steps || data.steps || [];
            const hasErrorHandling = steps.some((step) => step.template?.includes('try') && step.template?.includes('catch'));
            if (!hasErrorHandling) {
                result.warnings.push('Infrastructure layer should include error handling');
            }
        }
        // Presentation layer validations
        if (layerSchema.layer === 'presentation') {
            const steps = data.presentation_steps || data.steps || [];
            steps.forEach((step) => {
                if (step.template?.includes('business logic')) {
                    result.warnings.push(`Step '${step.id}': Presentation layer should not contain business logic`);
                }
            });
        }
        // Main layer validations
        if (layerSchema.layer === 'main') {
            const steps = data.main_steps || data.steps || [];
            const hasFactory = steps.some((step) => step.template?.includes('factory') || step.template?.includes('Factory'));
            if (!hasFactory) {
                result.warnings.push('Main layer should include factory pattern for dependency injection');
            }
        }
    }
    /**
     * Generic validation when no schema is available
     */
    validateGeneric(data, result) {
        // Check for required top-level sections
        const requiredSections = ['metadata', 'steps'];
        requiredSections.forEach(section => {
            if (!data[section]) {
                result.errors.push(`Missing required section: ${section}`);
                result.valid = false;
            }
        });
        // Check for common issues
        this.checkCommonIssues(data, result);
        return result;
    }
    /**
     * Check for common issues across all templates
     */
    checkCommonIssues(data, result) {
        const jsonString = JSON.stringify(data);
        // Check for unreplaced placeholders
        const placeholderRegex = /__[A-Z_]+__/g;
        const placeholders = jsonString.match(placeholderRegex);
        if (placeholders) {
            const unique = [...new Set(placeholders)];
            result.errors.push(`Unreplaced placeholders found: ${unique.join(', ')}`);
            result.valid = false;
        }
        // Check for FIND/REPLACE syntax issues
        if (jsonString.includes('<<<FIND>>>') && !jsonString.includes('<<</FIND>>>')) {
            result.errors.push('Malformed FIND/REPLACE block: missing closing tag');
            result.valid = false;
        }
        if (jsonString.includes('<<<REPLACE>>>') && !jsonString.includes('<<</REPLACE>>>')) {
            result.errors.push('Malformed FIND/REPLACE block: missing closing tag');
            result.valid = false;
        }
        // Check for proper RLHF scoring
        const steps = data.steps || data.domain_steps || data.data_steps ||
            data.infra_steps || data.presentation_steps || data.main_steps || [];
        steps.forEach((step) => {
            if (step.rlhf_score !== null && step.rlhf_score !== undefined) {
                if (step.rlhf_score < -2 || step.rlhf_score > 2) {
                    result.warnings.push(`Step '${step.id}': RLHF score ${step.rlhf_score} out of range (-2 to 2)`);
                }
            }
        });
    }
    /**
     * Print validation results
     */
    printResults(result) {
        console.log('\n' + '═'.repeat(80));
        console.log(chalk.cyan.bold('📋 Template Validation Results'));
        console.log('═'.repeat(80));
        if (result.schemaUsed) {
            console.log(chalk.blue(`\n🎯 Target: ${result.targetValidated}`));
            console.log(chalk.blue(`📊 Layer: ${result.layerValidated}`));
            console.log(chalk.blue(`📑 Schema: ${result.schemaUsed}`));
        }
        if (result.valid) {
            console.log(chalk.green.bold('\n✅ VALIDATION PASSED'));
        }
        else {
            console.log(chalk.red.bold('\n❌ VALIDATION FAILED'));
        }
        if (result.errors.length > 0) {
            console.log(chalk.red('\n❌ Errors:'));
            result.errors.forEach(error => {
                console.log(chalk.red(`   • ${error}`));
            });
        }
        if (result.warnings.length > 0) {
            console.log(chalk.yellow('\n⚠️  Warnings:'));
            result.warnings.forEach(warning => {
                console.log(chalk.yellow(`   • ${warning}`));
            });
        }
        console.log('\n' + '═'.repeat(80));
        if (result.valid) {
            console.log(chalk.green('✨ Template is valid and ready for use!'));
        }
        else {
            console.log(chalk.red('🔧 Please fix the errors above and validate again.'));
        }
        console.log('═'.repeat(80) + '\n');
    }
    /**
     * Validate all templates in a directory
     */
    async validateAll(directory = 'templates') {
        const templateFiles = fs.readdirSync(directory)
            .filter(file => file.endsWith('-template.regent'))
            .map(file => path.join(directory, file));
        console.log(chalk.cyan.bold('\n🚀 Validating all templates...'));
        console.log(chalk.gray(`Found ${templateFiles.length} templates to validate\n`));
        let passed = 0;
        let failed = 0;
        for (const templateFile of templateFiles) {
            console.log(chalk.blue(`\n📄 Validating: ${path.basename(templateFile)}`));
            const result = await this.validateTemplate(templateFile);
            if (result.valid) {
                console.log(chalk.green('   ✅ PASSED'));
                passed++;
            }
            else {
                console.log(chalk.red('   ❌ FAILED'));
                console.log(chalk.red(`      Errors: ${result.errors.length}`));
                failed++;
            }
        }
        console.log(chalk.cyan.bold('\n📊 Summary:'));
        console.log(chalk.green(`   ✅ Passed: ${passed}`));
        console.log(chalk.red(`   ❌ Failed: ${failed}`));
        console.log(chalk.blue(`   📋 Total: ${templateFiles.length}`));
    }
}
// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const validator = new EnhancedTemplateValidator();
    // Check for --json flag
    const jsonOutputIndex = args.indexOf('--json');
    const jsonOutput = jsonOutputIndex !== -1;
    if (jsonOutput) {
        args.splice(jsonOutputIndex, 1);
    }
    // Check for --file flag (supports both --file=path and --file path)
    let templatePath = null;
    const fileIndex = args.findIndex(arg => arg.startsWith('--file'));
    if (fileIndex !== -1) {
        const fileArg = args[fileIndex];
        if (fileArg.includes('=')) {
            // --file=path format
            templatePath = fileArg.split('=')[1];
        }
        else if (args[fileIndex + 1]) {
            // --file path format
            templatePath = args[fileIndex + 1];
        }
    }
    else if (args.length > 0 && !args[0].startsWith('--')) {
        // Direct path argument
        templatePath = args[0];
    }
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        console.log(chalk.cyan.bold('\n📖 Template Validator'));
        console.log(chalk.gray('\nUsage:'));
        console.log('  npx tsx validate-template.ts <template-file>');
        console.log('  npx tsx validate-template.ts --file=<template-file>');
        console.log('  npx tsx validate-template.ts --file=<template-file> --json');
        console.log('  npx tsx validate-template.ts --all');
        console.log('\nOptions:');
        console.log('  --file=<path>  Path to template file to validate');
        console.log('  --json         Output results as JSON (for programmatic use)');
        console.log('  --all          Validate all templates in templates/ directory');
        console.log('\nExamples:');
        console.log('  npx tsx validate-template.ts templates/backend-domain-template.regent');
        console.log('  npx tsx validate-template.ts --file=spec/001-feature/domain/implementation.yaml');
        console.log('  npx tsx validate-template.ts --file=spec/001-feature/domain/implementation.yaml --json');
        console.log('  npx tsx validate-template.ts --all');
        process.exit(0);
    }
    if (args[0] === '--all') {
        await validator.validateAll();
    }
    else if (templatePath) {
        const result = await validator.validateTemplate(templatePath);
        if (jsonOutput) {
            // Output JSON for programmatic use
            console.log(JSON.stringify(result, null, 2));
        }
        else {
            // Output formatted human-readable results
            validator.printResults(result);
        }
        process.exit(result.valid ? 0 : 1);
    }
    else {
        console.error(chalk.red('Error: No template file specified'));
        console.log('Run with --help for usage information');
        process.exit(1);
    }
}
// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}
export { EnhancedTemplateValidator };
