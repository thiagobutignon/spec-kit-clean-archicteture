# Task: Pre-Task Domain Planning

## 1. Your Deliverable

Your **only** output for this task is a single, complete, and well-formed **JSON object**. This JSON will serve as the input for the `/tasks-domain` command, which will then generate the final YAML plan.

## 2. Objective

Your goal is to transform a high-level, conceptual feature request into a detailed, structured JSON plan. This plan must be ready for the code generation phase and include all necessary details for creating or refactoring domain layer components.

## 3. Available Tools

- **External Knowledge:** `context7` MCP Server (for researching system design patterns).
- **Internal Codebase Analysis:** `Serena` MCP Server (for understanding existing code structure, conventions, and identifying files to be refactored).

## 4. Input Parameters

- **UserInput:** A natural language string describing a feature concept or a modification to an existing feature.

## 5. Step-by-Step Execution Plan

1.  **Deconstruct Request:** Identify the core concepts and entities in the `UserInput`. Determine if the request is for a **new feature** or a **modification** of an existing one.

2.  **External Research (The "What"):**
    a. Use `context7` to search for best practices related to the core concepts. Query sources like "awesome system design".
    b. From the results, identify common patterns, data structures, and error conditions. Collect the URLs of the most relevant sources.

3.  **Internal Analysis (The "How"):**
    a. Use `Serena` to analyze the existing project's `domain` layer.
    b. **If it's a new feature:** Use `list_dir` and `get_symbols_overview` to understand existing patterns and naming conventions for consistency.
    c. **If it's a modification:** Use `find_symbol` to locate the exact files and code symbols that need to be changed. Use `find_referencing_symbols` to identify other parts of the codebase that will be impacted by the change.

4.  **Synthesize the JSON Plan:**
    a. Combine the external knowledge (the "what") with the internal context (the "how").
    b. Construct a single JSON object. This object must have a `featureName` and a `steps` array.
    c. **For each required action, create a step object in the `steps` array.**
    d. **CRITICAL: For each step, you MUST decide the correct `type`:** - Use `type: 'create_file'` for generating entirely new files (use cases, errors, mocks). - Use `type: 'refactor_file'` for modifying existing files.
    e. **For each step, you MUST populate the `references` array:** - Add objects of type `external_pattern` with the `source`, `query`, `url`, and `description` from your `context7` research. - Add objects of type `internal_code_analysis` with the `source`, `tool`, `query`, and `description` from your `Serena` analysis.
    f. **For `create_file` steps:** Provide the full `template` content, including the populated `input`, `output`, and `mock` data fields.
    g. **For `refactor_file` steps:** Provide a `template` containing the `<<<REPLACE>>>` and `<<<WITH>>>` blocks, ensuring the `<<<REPLACE>>>` block matches the existing code exactly.

5.  **Final Output:**
    Present **only the JSON code block** as your final answer. Do not add explanations before or after it.

---

### Exemplo de JSON de Saída (O que a IA deve produzir)

Este exemplo mostra como a saída da IA ficaria para uma tarefa de refatoração, demonstrando a estrutura que o prompt agora a ensina a criar.

```json
{
  "featureName": "User Account",
  "steps": [
    {
      "id": "refactor-update-user-use-case",
      "type": "refactor_file",
      "description": "Refactor UpdateUser use case to include nickname",
      "path": "src/features/user-account/domain/use-cases/update-user.ts",
      "references": [
        {
          "type": "internal_code_analysis",
          "source": "serena",
          "tool": "find_symbol",
          "query": "UpdateUserInput",
          "description": "Identified UpdateUserInput as the target for modification."
        }
      ],
      "template": "<<<REPLACE>>>\nexport type UpdateUserInput = {\n  firstName?: string;\n  lastName?: string;\n}\n<<</REPLACE>>>\n<<<WITH>>>\nexport type UpdateUserInput = {\n  firstName?: string;\n  lastName?: string;\n  nickname?: string; // Added nickname\n}\n<<</WITH>>>"
    },
    {
      "id": "create-error-nickname-too-long",
      "type": "create_file",
      "description": "Create NicknameTooLong domain error",
      "path": "src/features/user-account/domain/errors/nickname-too-long.ts",
      "references": [
        {
          "type": "external_pattern",
          "source": "context7",
          "query": "system design validation errors",
          "url": "https://example.com/validation-patterns",
          "description": "Following standard practice of creating specific errors for validation failures."
        }
      ],
      "template": "export class NicknameTooLongError extends Error { ... }"
    }
  ]
}
```
