/**
 * Tests for Command Consistency Validator
 * Ensures the validator correctly detects inconsistencies across AI commands
 * Part of Issue #152 - Process for maintaining prompt consistency
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import * as path from 'path'
import { ValidationResult, CONSISTENCY_RULES } from '../validate-command-consistency'

// Mock fs/promises before importing validator
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn()
  },
  readFile: vi.fn()
}))

// Import after mocking
import * as fs from 'fs/promises'
import { CommandConsistencyValidator } from '../validate-command-consistency'

describe('CommandConsistencyValidator', () => {
  let validator: CommandConsistencyValidator
  const mockProjectRoot = '/mock/project'

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
    // Create validator with mock project root
    validator = new CommandConsistencyValidator(mockProjectRoot)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Detection of Missing Required Terms', () => {
    it('should detect when a required term is missing from a command file', async () => {
      // Mock file reads - one file missing a specific critical term
      vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
        const fileName = path.basename(filePath as string)
        // Make 02-validate-layer-plan.md explicitly missing "sharedComponents"
        // Use unique separator to ensure the term is truly missing
        if (fileName === '02-validate-layer-plan.md') {
          return 'useCases|Edge Case|RLHF|Clean Architecture'
        }
        // All other files have all terms
        return 'sharedComponents|useCases|Edge Case|RLHF|Clean Architecture'
      })

      const result = await validator.validate()

      expect(result.passed).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      // Check that the error is specifically about 02-validate-layer-plan.md missing sharedComponents
      const hasExpectedError = result.errors.some(e =>
        e.includes('02-validate-layer-plan.md') && e.includes('sharedComponents')
      )
      expect(hasExpectedError).toBe(true)
    })

    it('should pass when all required terms are present', async () => {
      // Mock all files to contain all required terms
      vi.mocked(fs.readFile).mockResolvedValue(
        'This file contains sharedComponents, useCases, Edge Case, RLHF, and Clean Architecture'
      )

      const result = await validator.validate()

      expect(result.passed).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should check all files specified in rule.required_in', async () => {
      const readFileSpy = vi.mocked(fs.readFile)
      readFileSpy.mockResolvedValue('Content with all terms: sharedComponents useCases Edge Case RLHF Clean Architecture')

      await validator.validate()

      // Get unique file names from all rules
      const uniqueFiles = new Set(
        CONSISTENCY_RULES.flatMap(rule => rule.required_in)
      )

      // Verify each file was read at least once
      expect(readFileSpy).toHaveBeenCalledTimes(
        CONSISTENCY_RULES.reduce((sum, rule) => sum + rule.required_in.length, 0)
      )
    })
  })

  describe('Severity Level Handling', () => {
    it('should treat missing error-level terms as errors', async () => {
      // Find an error-severity rule
      const errorRule = CONSISTENCY_RULES.find(r => r.severity === 'error')
      expect(errorRule).toBeDefined()

      // Mock file to be missing the error-level term
      vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
        const fileName = path.basename(filePath as string)
        if (errorRule && errorRule.required_in.includes(fileName)) {
          return 'Content without the required term'
        }
        return `Content with all terms including ${errorRule?.term}`
      })

      const result = await validator.validate()

      expect(result.passed).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should treat missing warning-level terms as warnings, not errors', async () => {
      // Find a warning-severity rule
      const warningRule = CONSISTENCY_RULES.find(r => r.severity === 'warning')

      if (warningRule) {
        // Mock file to be missing the warning-level term
        vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
          const fileName = path.basename(filePath as string)
          if (warningRule.required_in.includes(fileName)) {
            // Missing warning term but has all error terms
            return 'Content with sharedComponents useCases RLHF Clean Architecture'
          }
          // Other files have all terms including the warning term
          return `Content with all terms including ${warningRule.term} sharedComponents useCases RLHF Clean Architecture`
        })

        const result = await validator.validate()

        // Should pass validation (warnings don't fail validation)
        expect(result.passed).toBe(true)
        expect(result.warnings.length).toBeGreaterThan(0)
        expect(result.errors).toHaveLength(0)
      }
    })

    it('should distinguish between errors and warnings in results', async () => {
      const errorRule = CONSISTENCY_RULES.find(r => r.severity === 'error')
      const warningRule = CONSISTENCY_RULES.find(r => r.severity === 'warning')

      vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
        const fileName = path.basename(filePath as string)

        // Missing both error and warning terms in specific files
        if (errorRule?.required_in.includes(fileName)) {
          return 'Missing error term'
        }
        if (warningRule?.required_in.includes(fileName)) {
          return 'Missing warning term'
        }

        return 'Content with all terms'
      })

      const result = await validator.validate()

      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.passed).toBe(false)
    })
  })

  describe('Error Handling for Missing Files', () => {
    it('should handle file read errors gracefully', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(
        new Error('ENOENT: no such file or directory')
      )

      const result = await validator.validate()

      expect(result.passed).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.includes('Failed to read'))).toBe(true)
    })

    it('should report which file failed to read', async () => {
      const failingFile = '01-plan-layer-features.md'

      vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
        const fileName = path.basename(filePath as string)
        if (fileName === failingFile) {
          throw new Error('File not found')
        }
        return 'Content with all terms: sharedComponents useCases Edge Case RLHF Clean Architecture'
      })

      const result = await validator.validate()

      expect(result.passed).toBe(false)
      expect(result.errors.some(e => e.includes(failingFile))).toBe(true)
    })

    it('should continue validation even if one file fails', async () => {
      const readFileSpy = vi.mocked(fs.readFile)
      let callCount = 0

      readFileSpy.mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          throw new Error('First file failed')
        }
        return 'Content with all terms'
      })

      await validator.validate()

      // Should have attempted to read more than one file
      expect(readFileSpy.mock.calls.length).toBeGreaterThan(1)
    })
  })

  describe('Consistency Rules Validation', () => {
    it('should validate all defined consistency rules', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        'Content with all terms: sharedComponents useCases Edge Case RLHF Clean Architecture'
      )

      await validator.validate()

      // Verify all rules are being checked
      expect(CONSISTENCY_RULES.length).toBeGreaterThan(0)

      // Each rule should have required fields
      CONSISTENCY_RULES.forEach(rule => {
        expect(rule.term).toBeDefined()
        expect(rule.required_in).toBeDefined()
        expect(rule.required_in.length).toBeGreaterThan(0)
        expect(rule.description).toBeDefined()
        expect(rule.severity).toMatch(/^(error|warning)$/)
      })
    })

    it('should check each term against all its required files', async () => {
      const readFileSpy = vi.mocked(fs.readFile)
      readFileSpy.mockResolvedValue('Content with all terms: sharedComponents useCases Edge Case RLHF Clean Architecture')

      await validator.validate()

      // Count expected reads: sum of all required_in array lengths
      const expectedReads = CONSISTENCY_RULES.reduce(
        (sum, rule) => sum + rule.required_in.length,
        0
      )

      expect(readFileSpy).toHaveBeenCalledTimes(expectedReads)
    })
  })

  describe('ValidationResult Structure', () => {
    it('should return ValidationResult with correct structure', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('Content with all terms')

      const result = await validator.validate()

      expect(result).toHaveProperty('passed')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('warnings')
      expect(typeof result.passed).toBe('boolean')
      expect(Array.isArray(result.errors)).toBe(true)
      expect(Array.isArray(result.warnings)).toBe(true)
    })

    it('should populate errors array when validation fails', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('Content missing required terms')

      const result = await validator.validate()

      expect(result.passed).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      result.errors.forEach(error => {
        expect(typeof error).toBe('string')
        expect(error.length).toBeGreaterThan(0)
      })
    })

    it('should have empty arrays when all checks pass', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        'Content with all terms: sharedComponents useCases Edge Case RLHF Clean Architecture'
      )

      const result = await validator.validate()

      expect(result.passed).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })
  })

  describe('Path Resolution', () => {
    it('should construct correct file paths from project root', async () => {
      const readFileSpy = vi.mocked(fs.readFile)
      readFileSpy.mockResolvedValue('Content with all terms')

      await validator.validate()

      // Check that paths are constructed correctly
      const calls = readFileSpy.mock.calls
      calls.forEach(call => {
        const filePath = call[0] as string
        expect(filePath).toContain('.claude/commands')
        expect(filePath).toContain(mockProjectRoot)
      })
    })

    it('should work with custom project root', async () => {
      const customRoot = '/custom/path'
      const customValidator = new CommandConsistencyValidator(customRoot)

      vi.mocked(fs.readFile).mockResolvedValue('Content with all terms')

      await customValidator.validate()

      const calls = vi.mocked(fs.readFile).mock.calls
      calls.forEach(call => {
        const filePath = call[0] as string
        expect(filePath).toContain(customRoot)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty file content', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('')

      const result = await validator.validate()

      // Empty files should fail validation (missing all terms)
      expect(result.passed).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle files with special characters', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        'Content with sharedComponents, useCases, Edge Case, RLHF, and Clean Architecture!'
      )

      const result = await validator.validate()

      expect(result.passed).toBe(true)
    })

    it('should be case-sensitive when matching terms', async () => {
      // File has lowercase version of terms
      vi.mocked(fs.readFile).mockResolvedValue(
        'Content with sharedcomponents, usecases, edge case, rlhf, clean architecture'
      )

      const result = await validator.validate()

      // Should fail because terms are case-sensitive
      expect(result.passed).toBe(false)
    })
  })

  describe('Performance', () => {
    it('should complete validation in reasonable time', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('Content with all terms')

      const startTime = Date.now()
      await validator.validate()
      const endTime = Date.now()

      // Should complete in less than 1 second for small number of files
      expect(endTime - startTime).toBeLessThan(1000)
    })
  })
})

describe('CONSISTENCY_RULES', () => {
  it('should export consistency rules array', () => {
    expect(CONSISTENCY_RULES).toBeDefined()
    expect(Array.isArray(CONSISTENCY_RULES)).toBe(true)
    expect(CONSISTENCY_RULES.length).toBeGreaterThan(0)
  })

  it('should have valid rule structures', () => {
    CONSISTENCY_RULES.forEach(rule => {
      expect(rule).toHaveProperty('term')
      expect(rule).toHaveProperty('required_in')
      expect(rule).toHaveProperty('description')
      expect(rule).toHaveProperty('severity')

      expect(typeof rule.term).toBe('string')
      expect(Array.isArray(rule.required_in)).toBe(true)
      expect(typeof rule.description).toBe('string')
      expect(['error', 'warning']).toContain(rule.severity)
    })
  })

  it('should check critical architectural concepts', () => {
    const terms = CONSISTENCY_RULES.map(r => r.term)

    // Verify key concepts are included
    expect(terms).toContain('sharedComponents')
    expect(terms).toContain('useCases')
    expect(terms).toContain('RLHF')
    expect(terms).toContain('Clean Architecture')
  })

  it('should have appropriate severity levels', () => {
    // Core architectural concepts should be errors
    const errorRules = CONSISTENCY_RULES.filter(r => r.severity === 'error')
    const errorTerms = errorRules.map(r => r.term)

    expect(errorTerms).toContain('sharedComponents')
    expect(errorTerms).toContain('useCases')
    expect(errorTerms).toContain('RLHF')
    expect(errorTerms).toContain('Clean Architecture')
  })
})
