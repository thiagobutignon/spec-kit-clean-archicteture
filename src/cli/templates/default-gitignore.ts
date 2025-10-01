/**
 * Default .gitignore template for new Regent projects
 */

export const DEFAULT_GITIGNORE_TEMPLATE = `# Dependencies
node_modules/
.pnp
.pnp.js

# Production
/build
/dist

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
`;

/**
 * Regent-specific entries to add to existing .gitignore files
 */
export const REGENT_GITIGNORE_ENTRIES = [
  '# Spec-kit clean architecture',
  '.rlhf/',
  '.logs/',
  '.regent/templates/*-template.regent',
  '!.regent/templates/parts/',
  '.regent-backups/'
];
