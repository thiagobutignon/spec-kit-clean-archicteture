# 🔬 DEEP RESEARCH PROMPT: Template Size Optimization

## CONTEXT
We have a critical architectural problem: Our .regent template files exceed Claude Code's 25,000 token limit, making them unreadable and breaking the entire system. These templates are essentially "system prompts" that define our Clean Architecture implementation.

## PROBLEM STATEMENT
- **Current**: backend-domain-template.regent has 26,161 tokens (2,203 lines)
- **Limit**: Claude Code can only read 25,000 tokens at once
- **Impact**: Templates cannot be used, breaking entire workflow

## RESEARCH QUESTIONS

### 1. Token Analysis
- What is the exact token-to-line ratio in our templates?
- Which sections consume the most tokens?
- Can we identify redundant or verbose sections?

### 2. Content Optimization
Please analyze the template structure and identify:
- Repeated patterns that could be extracted
- Verbose descriptions that could be condensed
- Comments that could be minimized
- Whitespace that could be reduced

### 3. Architectural Solutions
Evaluate these approaches:

#### A. Template Splitting Strategy
```yaml
# Instead of one large file:
backend-domain-template.regent (26k tokens)

# Split into:
backend-domain-core.regent (10k tokens)
backend-domain-rules.regent (8k tokens)
backend-domain-steps.regent (8k tokens)
```

#### B. MCP Server Solution
```typescript
// MCP server that serves template content
interface TemplateServer {
  getSection(template: string, section: string): Promise<string>
  getRule(template: string, rule: string): Promise<string>
  streamTemplate(template: string): AsyncIterator<string>
}
```

#### C. Template Preprocessing
```bash
# Build process that creates:
backend-domain-template.regent        # Full version for humans
backend-domain-template.min.regent    # Minified for Claude
backend-domain-template.chunks/       # Chunked for streaming
```

### 4. Implementation Feasibility
For each solution, evaluate:
- Development effort required
- Impact on existing workflows
- Backward compatibility
- Maintenance burden
- Performance implications

## FILES TO ANALYZE

### Template Structure
```
templates/
├── backend-domain-template.regent (26k tokens - PROBLEM)
├── parts/
│   ├── shared/
│   │   ├── 00-header.part.regent
│   │   └── 01-footer.part.regent
│   └── backend/
│       ├── 01-structure.part.regent
│       ├── 02-architecture.part.regent
│       ├── 03-rules.part.regent
│       └── steps/
│           └── 01-domain.part.regent
```

### Build Process
- `templates/build-template.sh` - How templates are assembled
- Consider if build process adds unnecessary content

## SPECIFIC ANALYSIS NEEDED

### 1. Section Breakdown
Please provide token count for each major section:
```yaml
metadata:        [? tokens]
structure:       [? tokens]
architecture:    [? tokens]
rules:          [? tokens]
domain_steps:   [? tokens]
documentation:  [? tokens]
```

### 2. Redundancy Analysis
Identify:
- Repeated text patterns
- Similar rule definitions
- Duplicate examples
- Verbose explanations that could be shortened

### 3. Critical vs Optional
Classify content as:
- **Critical**: Must be in template for system to work
- **Important**: Should be included but could be referenced
- **Optional**: Nice to have but could be external
- **Redundant**: Can be removed without impact

## EXPECTED DELIVERABLE

### 1. Immediate Fix (Quick Win)
A way to reduce current templates below 25k tokens:
- Specific lines/sections to remove
- Compression techniques to apply
- Minimum viable template content

### 2. Short-term Solution (1 week)
Architectural change to handle large templates:
- Implementation plan
- Code changes required
- Migration strategy

### 3. Long-term Solution (1 month)
Optimal architecture for template system:
- Design document
- Pros/cons analysis
- Future scalability

## CONSTRAINTS

1. **Must maintain**: Template functionality and Clean Architecture principles
2. **Cannot break**: Existing workflows and commands
3. **Should improve**: Developer experience and maintainability
4. **Must support**: Future template growth

## EXECUTION INSTRUCTIONS

1. First, analyze the full backend-domain-template.regent file
2. Count tokens per section using appropriate tooling
3. Identify optimization opportunities
4. Propose concrete solutions with examples
5. Provide implementation roadmap

## SUCCESS CRITERIA

✅ All templates readable by Claude Code (< 25k tokens)
✅ No loss of critical functionality
✅ Maintainable solution
✅ Clear migration path
✅ Documentation for changes

---

**Note**: This is a critical blocker. The entire REGENT system depends on templates being readable. Without fixing this, the system cannot function as designed.