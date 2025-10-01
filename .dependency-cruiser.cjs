// .dependency-cruiser.js
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-layer-purity',
      severity: 'error',
      comment: 'Domain layer must not import from outer layers (Clean Architecture)',
      from: {
        path: 'src/features/.*/domain'
      },
      to: {
        path: 'src/features/.*/(data|infra|presentation|validation|main)',
        pathNot: 'node_modules'
      }
    },
    {
      name: 'data-cannot-import-presentation',
      severity: 'error',
      comment: 'Data layer cannot import from presentation layer',
      from: {
        path: 'src/features/.*/data'
      },
      to: {
        path: 'src/features/.*/presentation'
      }
    },
    {
      name: 'data-cannot-import-infra',
      severity: 'error',
      comment: 'Data layer cannot import from infrastructure layer',
      from: {
        path: 'src/features/.*/data'
      },
      to: {
        path: 'src/features/.*/infra'
      }
    },
    {
      name: 'infra-cannot-import-presentation',
      severity: 'error',
      comment: 'Infrastructure layer cannot import from presentation layer',
      from: {
        path: 'src/features/.*/infra'
      },
      to: {
        path: 'src/features/.*/presentation'
      }
    },
    {
      name: 'infra-cannot-import-data',
      severity: 'error',
      comment: 'Infrastructure layer cannot import from data layer',
      from: {
        path: 'src/features/.*/infra'
      },
      to: {
        path: 'src/features/.*/data'
      }
    },
    {
      name: 'presentation-cannot-import-data',
      severity: 'error',
      comment: 'Presentation layer cannot import from data layer',
      from: {
        path: 'src/features/.*/presentation'
      },
      to: {
        path: 'src/features/.*/data'
      }
    },
    {
      name: 'presentation-cannot-import-infra',
      severity: 'error',
      comment: 'Presentation layer cannot import from infrastructure layer',
      from: {
        path: 'src/features/.*/presentation'
      },
      to: {
        path: 'src/features/.*/infra'
      }
    },
    {
      name: 'no-circular-dependencies',
      severity: 'warn',
      comment: 'Circular dependencies make code harder to maintain',
      from: {},
      to: { circular: true }
    },
    {
      name: 'no-orphans',
      severity: 'info',
      comment: 'Orphan modules are not imported anywhere',
      from: {
        orphan: true,
        pathNot: '(spec|test|stories|mock|\\\.test\\\.ts$|\\\.spec\\\.ts$)'
      },
      to: {}
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+'
      },
      archi: {
        collapsePattern: '^(node_modules|src/features/[^/]+/(domain|data|infra|presentation|validation|main))'
      }
    }
  }
};
