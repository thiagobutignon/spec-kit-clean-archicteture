# Placeholder Registry

This document lists all placeholders used in the regent templates and their expected replacements.

## Naming Convention Placeholders

These placeholders transform a feature name into different case formats:

| Placeholder | Description | Example Input | Example Output |
|------------|-------------|---------------|----------------|
| `__FEATURE_NAME_PASCAL_CASE__` | Feature name in PascalCase | "user authentication" | "UserAuthentication" |
| `__FEATURE_NAME_KEBAB_CASE__` | Feature name in kebab-case | "user authentication" | "user-authentication" |
| `__FEATURE_NAME_LOWER_CASE__` | Feature name in lowercase | "user authentication" | "user authentication" |
| `__FEATURE_NAME_CAMEL_CASE__` | Feature name in camelCase | "user authentication" | "userAuthentication" |
| `__FEATURE_NAME_UPPER_CASE__` | Feature name in UPPERCASE | "user authentication" | "USER_AUTHENTICATION" |

## Entity/Model Placeholders

| Placeholder | Description | Example |
|------------|-------------|---------|
| `__ENTITY_NAME__` | Name of the domain entity | "User", "Product", "Order" |
| `__ENTITY_DEFINITION_IN_BUSINESS_CONTEXT__` | Business definition of the entity | "A registered person in our system" |
| `__VALUE_OBJECT_NAME__` | Name of a value object | "Email", "Money", "Address" |
| `__VALUE_OBJECT_BUSINESS_MEANING__` | Business meaning of the value object | "Unique identifier for user communication" |
| `__DOMAIN_EVENT__` | Name of a domain event | "UserCreated", "OrderPlaced" |
| `__EVENT_BUSINESS_SIGNIFICANCE__` | Business significance of the event | "Indicates a new user has been registered" |

## Use Case Placeholders

| Placeholder | Description | Example |
|------------|-------------|---------|
| `__ACTION_ENTITY_PASCAL_CASE__` | Action + Entity in PascalCase | "CreateUser", "UpdateProduct" |
| `__ACTION_ENTITY_KEBAB_CASE__` | Action + Entity in kebab-case | "create-user", "update-product" |
| `__ACTION_ENTITY_LOWER_CASE__` | Action + Entity in lowercase | "create user", "update product" |
| `__USE_CASE_DESCRIPTION__` | Description of the use case | "Creates a new user account in the system" |
| `__USE_CASE_INPUT_FIELDS__` | Input fields for the use case | "name: string; email: string;" |
| `__USE_CASE_OUTPUT_FIELDS__` | Output fields for the use case | "id: string; createdAt: Date;" |

## Error Placeholders

| Placeholder | Description | Example |
|------------|-------------|---------|
| `__ERROR_NAME_PASCAL_CASE__` | Error name in PascalCase | "UserNotFound", "InvalidEmail" |
| `__ERROR_NAME_KEBAB_CASE__` | Error name in kebab-case | "user-not-found", "invalid-email" |
| `__ERROR_DESCRIPTION__` | Description of when error occurs | "user with specified ID does not exist" |
| `__ERROR_MESSAGE__` | User-facing error message | "User not found" |

## File/Path Placeholders

| Placeholder | Description | Example |
|------------|-------------|---------|
| `__PROJECT_NAME__` | Name of the project/root directory | "my-app", "backend", "frontend" |
| `__LAYER__` | Architecture layer name | "domain", "data", "infra", "presentation" |
| `__FILE_TO_MODIFY_PASCAL_CASE__` | File name to modify in PascalCase | "UserController", "AuthService" |
| `__FILE_TO_MODIFY_KEBAB_CASE__` | File name to modify in kebab-case | "user-controller", "auth-service" |
| `__FILE_TO_DELETE_PASCAL_CASE__` | File name to delete in PascalCase | "OldController", "DeprecatedService" |
| `__FILE_TO_DELETE_KEBAB_CASE__` | File name to delete in kebab-case | "old-controller", "deprecated-service" |

## Mock/Test Data Placeholders

| Placeholder | Description | Example |
|------------|-------------|---------|
| `__MOCK_INPUT_DATA__` | Mock input data for tests | "name: 'John Doe', email: 'john@example.com'" |
| `__MOCK_OUTPUT_DATA__` | Mock output data for tests | "id: '123', success: true" |

## Ubiquitous Language Placeholders

| Placeholder | Description | Example |
|------------|-------------|---------|
| `__UBIQUITOUS_LANGUAGE_TERM__` | Domain-specific term | "Account", "Transaction", "Portfolio" |

## Metadata Placeholders

| Placeholder | Description | Example |
|------------|-------------|---------|
| `__CURRENT_DATE__` | Current date in YYYY-MM-DD format | "2024-01-23" |
| `__SYMBOL_BEING_CHANGED__` | Symbol name being refactored | "createUser", "UserModel" |

## Git/PR Placeholders

| Placeholder | Description | Example |
|------------|-------------|---------|
| `__VALIDATOR__` | Validator name | "EmailValidator", "RequiredFieldValidator" |
| `__ADAPTER__` | Adapter name | "HttpClientAdapter", "DatabaseAdapter" |
| `__REPOSITORY__` | Repository name | "UserRepository", "ProductRepository" |
| `__CONTROLLER__` | Controller name | "AuthController", "UserController" |
| `__MIDDLEWARE__` | Middleware name | "AuthMiddleware", "ValidationMiddleware" |
| `__FACTORY__` | Factory name | "UserFactory", "ControllerFactory" |
| `__PROTOCOL__` | Protocol/Interface name | "HttpClient", "Repository" |
| `__HOOK__` | React hook name | "Auth", "User" (results in useAuth, useUser) |
| `__COMPONENT__` | Component name | "Button", "Card", "LoginForm" |
| `__MODEL__` | Model name | "UserModel", "ProductModel" |
| `__USE_CASE__` | Use case name | "CreateUser", "AuthenticateUser" |

## Usage Guidelines

1. **When to Replace**: All placeholders should be replaced when generating actual implementation files
2. **Case Consistency**: Ensure the correct case format is used for each context
3. **Validation**: The AI system should validate that no placeholders remain in final implementation
4. **Documentation**: Keep this registry updated when adding new placeholders

## Replacement Examples

### Example 1: Creating a User Feature
```yaml
# Input: feature_name = "user management"
__FEATURE_NAME_PASCAL_CASE__ → "UserManagement"
__FEATURE_NAME_KEBAB_CASE__ → "user-management"
__ENTITY_NAME__ → "User"
__ACTION_ENTITY_PASCAL_CASE__ → "CreateUser"
```

### Example 2: Creating an Authentication Feature
```yaml
# Input: feature_name = "authentication"
__FEATURE_NAME_PASCAL_CASE__ → "Authentication"
__FEATURE_NAME_KEBAB_CASE__ → "authentication"
__USE_CASE__ → "AuthenticateUser"
__ERROR_NAME_PASCAL_CASE__ → "InvalidCredentials"
```

## Validation Rules

1. **No Unreplaced Placeholders**: Final implementation must not contain `__*__` patterns
2. **Case Matching**: Replacements must match the specified case format
3. **Context Appropriate**: Replacements must make sense in their context
4. **Consistent Throughout**: Same placeholder must have same replacement throughout the template