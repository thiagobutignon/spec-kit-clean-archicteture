# Template Chunks Index

## Overview
This directory contains chunked versions of oversized templates.
Created to fix Issue #94: Templates exceed Claude Code's 25k token limit.

## Chunked Templates
- **backend-infra-template.regent**: chunks/backend-infra-template
- **backend-presentation-template.regent**: chunks/backend-presentation-template
- **frontend-infra-template.regent**: chunks/frontend-infra-template
- **frontend-presentation-template.regent**: chunks/frontend-presentation-template
- **fullstack-data-template.regent**: chunks/fullstack-data-template
- **fullstack-domain-template.regent**: chunks/fullstack-domain-template
- **fullstack-infra-template.regent**: chunks/fullstack-infra-template
- **fullstack-main-template.regent**: chunks/fullstack-main-template
- **fullstack-presentation-template.regent**: chunks/fullstack-presentation-template

## Usage
Use `TemplateChunker.reassembleTemplate()` to reconstruct full templates from chunks.

Generated: 2025-09-28T21:27:37.916Z
