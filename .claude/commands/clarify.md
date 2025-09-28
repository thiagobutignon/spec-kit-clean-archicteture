---
title: "Clarify Ambiguous Requirements"
description: "Identify and resolve ambiguous areas in specifications before implementation planning"
category: "analysis"
stage: "clarification"
priority: 2.5
tags:
  - clarification
  - requirements
  - risk-reduction
  - specification-refinement
parameters:
  spec_id:
    type: "string"
    description: "Specification ID to clarify"
    required: true
  areas:
    type: "array"
    description: "Specific areas to focus on"
    required: false
next_command: "/plan from spec: [spec-id] (after clarifications)"
---

# Task: Clarify Ambiguous Requirements

You are identifying and resolving **ambiguous, underspecified, or risky areas** in a feature specification before proceeding to implementation planning. This step reduces implementation risks and prevents architectural mistakes.

## 🎯 Purpose

**Risk Reduction**: Catch ambiguities before they become expensive implementation problems
**Quality Assurance**: Ensure specifications are clear enough for deterministic implementation
**Stakeholder Alignment**: Verify understanding of business requirements

## 📋 Input Processing

**Specification**: Load from `.specify/specs/$SPEC_ID/spec.md`
**Focus Areas**: $AREAS (optional - if not specified, analyze entire specification)

## 🔍 Clarification Analysis Framework

### 1. Business Logic Ambiguities

#### Domain Model Clarity
```markdown
## 🎯 Domain Model Analysis

### Entity Relationships
**Question**: How does [Entity A] relate to [Entity B]?
- **Current Spec**: [What specification currently says]
- **Ambiguity**: [What's unclear or missing]
- **Business Impact**: [Why this matters for implementation]
- **Proposed Clarification**: [Suggested resolution]

### Business Rule Completeness
**Question**: What happens when [business condition] occurs?
- **Current Spec**: [Current rule definition]
- **Edge Cases**: [Unhandled scenarios]
- **Validation Rules**: [Missing constraints]
- **Error Conditions**: [Unspecified failure cases]
```

#### Ubiquitous Language Gaps
```markdown
### Term Definitions
**Question**: What exactly does "[DOMAIN_TERM]" mean in this context?
- **Current Usage**: [How term is used in spec]
- **Potential Interpretations**: [Different possible meanings]
- **Domain Expert Input Needed**: [What to clarify with business]
- **Suggested Definition**: [Proposed clear definition]
```

### 2. Use Case Ambiguities

#### Flow Completeness
```markdown
## 🔄 Use Case Flow Analysis

### Alternative Flows
**Question**: What happens when [condition] occurs during [step]?
- **Happy Path**: [Currently specified]
- **Alternative Scenarios**: [Missing or unclear paths]
- **Error Handling**: [Unspecified error cases]
- **Recovery Procedures**: [Missing recovery steps]

### Precondition Clarity
**Question**: What must be true before this use case can execute?
- **Stated Preconditions**: [Currently specified]
- **Implicit Assumptions**: [Unstated requirements]
- **System State**: [Required system conditions]
- **User Context**: [Required user state/permissions]
```

### 3. Technical Ambiguities

#### Data Model Uncertainties
```markdown
## 💾 Data Model Analysis

### Data Relationships
**Question**: How is [data element] related to [other data]?
- **Current Specification**: [What's currently defined]
- **Missing Relationships**: [Unclear associations]
- **Cardinality Questions**: [One-to-many? Many-to-many?]
- **Referential Integrity**: [Cascade rules? Constraints?]

### Data Validation Rules
**Question**: What are the exact validation rules for [field]?
- **Format Requirements**: [Pattern, length, type]
- **Business Rules**: [Domain-specific constraints]
- **Cross-Field Validation**: [Inter-field dependencies]
- **Temporal Constraints**: [Time-based rules]
```

#### Integration Ambiguities
```markdown
### External System Integration
**Question**: How exactly does the system integrate with [external service]?
- **API Contract**: [What's defined vs unclear]
- **Data Format**: [Expected input/output formats]
- **Error Handling**: [How to handle external failures]
- **Retry Logic**: [When and how to retry]
- **Fallback Behavior**: [What to do when external service unavailable]
```

### 4. Performance and Scale Ambiguities

#### Performance Requirements
```markdown
## ⚡ Performance Analysis

### Response Time Expectations
**Question**: What are the acceptable response times for [operation]?
- **Current Spec**: [What's currently stated]
- **Missing Benchmarks**: [Unstated performance requirements]
- **User Experience Impact**: [How performance affects UX]
- **System Load Scenarios**: [Peak usage considerations]

### Data Volume Handling
**Question**: How much data will this feature handle?
- **Initial Volume**: [Expected starting data size]
- **Growth Projections**: [How data will grow over time]
- **Query Performance**: [Large dataset query requirements]
- **Storage Implications**: [Database design considerations]
```

### 5. Security and Compliance Ambiguities

#### Access Control
```markdown
## 🔐 Security Analysis

### Authorization Rules
**Question**: Who can perform [action] under what conditions?
- **Current Permissions**: [What's currently specified]
- **Role-Based Access**: [Unclear role boundaries]
- **Contextual Access**: [Situation-dependent permissions]
- **Data Sensitivity**: [Classification and protection levels]

### Audit and Compliance
**Question**: What audit trail is required for [operation]?
- **Regulatory Requirements**: [Legal/compliance needs]
- **Audit Log Details**: [What to log and how]
- **Data Retention**: [How long to keep audit data]
- **Privacy Implications**: [PII handling requirements]
```

## 🤔 Clarification Question Categories

### Category 1: High-Risk Ambiguities (Address First)
- **Architectural Decisions**: Affect multiple layers
- **Data Model Structure**: Impact database design
- **Integration Contracts**: Affect external dependencies
- **Performance Requirements**: Influence technology choices

### Category 2: Implementation Ambiguities (Address Before Coding)
- **Business Rule Details**: Affect domain logic
- **Validation Requirements**: Impact input processing
- **Error Handling**: Affect user experience
- **Edge Case Behavior**: Prevent runtime issues

### Category 3: Process Ambiguities (Address During Development)
- **Testing Scenarios**: Define acceptance tests
- **Deployment Requirements**: Infrastructure needs
- **Monitoring Needs**: Operational requirements
- **Documentation Standards**: Knowledge transfer

## 📝 Clarification Output Format

### For Each Identified Ambiguity:

```markdown
### Ambiguity #[NUMBER]: [TITLE]

**Category**: [High-Risk/Implementation/Process]
**Domain Area**: [Which part of the domain this affects]
**Impact Level**: [Critical/High/Medium/Low]

#### Current State
[What the specification currently says or doesn't say]

#### Specific Questions
1. [Specific question that needs answering]
2. [Another specific question]
3. [Additional question if needed]

#### Why This Matters
[Business and technical impact of the ambiguity]

#### Proposed Resolution
[Suggested approach to resolve the ambiguity]

#### Stakeholders to Consult
- **Business**: [Who to ask for business clarification]
- **Technical**: [Who to consult for technical decisions]
- **Users**: [If user research/feedback needed]

#### Implementation Impact
[How resolution affects the implementation plan]
```

## 🎯 Clarification Strategies

### 1. Business Stakeholder Questions
- **Domain Expert Consultation**: Business rule clarifications
- **User Representative Input**: User experience expectations
- **Product Owner Decisions**: Priority and scope clarifications

### 2. Technical Team Analysis
- **Architecture Review**: Technical feasibility and approach
- **Database Design Session**: Data model refinement
- **Integration Planning**: External system coordination

### 3. Prototype/Spike Investigation
- **Technical Spikes**: Investigate unknown technical areas
- **UI/UX Prototypes**: Clarify user interaction flows
- **Performance Testing**: Validate performance assumptions

## ✅ Clarification Completion Criteria

### All High-Risk Ambiguities Resolved
- [ ] **Architectural decisions** made and documented
- [ ] **Data model** clearly defined
- [ ] **Integration contracts** specified
- [ ] **Performance requirements** quantified

### Implementation-Ready Specification
- [ ] **Business rules** completely specified
- [ ] **Use case flows** cover all scenarios
- [ ] **Validation requirements** clearly defined
- [ ] **Error conditions** and handling specified

### Stakeholder Alignment
- [ ] **Business stakeholders** have reviewed and approved clarifications
- [ ] **Technical team** understands all requirements
- [ ] **Updated specification** reflects all clarifications

## 📁 Output Files

Create these files in `.specify/specs/[SPEC-ID]/`:

1. **`clarifications.md`** - All identified ambiguities and resolutions
2. **`updated-spec.md`** - Specification updated with clarifications
3. **`stakeholder-decisions.md`** - Business decisions and rationale
4. **`technical-decisions.md`** - Technical approach decisions
5. **`open-questions.md`** - Any remaining questions for later resolution

## 🔄 Iterative Clarification

### Multiple Rounds May Be Needed
1. **Initial Analysis**: Identify obvious ambiguities
2. **Stakeholder Input**: Gather clarifications
3. **Technical Review**: Assess technical implications
4. **Refinement**: Address new questions that arise
5. **Final Validation**: Confirm all critical ambiguities resolved

## 📍 Next Steps

After clarification is complete:

1. **Update specification** with all clarifications
2. **Document decisions** and rationale
3. **Proceed to planning**: `/plan from spec: [SPEC-ID]`
4. **Reference clarifications** during implementation

The goal is to have a specification clear enough that implementation planning can proceed without major unknowns or assumptions.