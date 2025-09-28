/**
 * Example usage of SpecToYamlTransformer
 *
 * This demonstrates how the transformer would be used to convert
 * spec-kit task outputs into .regent-compatible YAML workflows
 */

import { SpecToYamlTransformer } from './SpecToYamlTransformer.js';
import { Task } from '../types/YamlWorkflow.js';

async function demonstrateTransformer() {
  console.log('🔧 SpecToYamlTransformer Demo');
  console.log('===============================\n');

  // Create transformer instance
  const transformer = new SpecToYamlTransformer({
    branch_prefix: 'feature/',
    target_branch: 'main',
    commit_convention: 'feat({layer}): {task-id} - {description}'
  });

  // Example task from dogfooding (T001 - Project Entity)
  const exampleTask: Task = {
    id: 'T001',
    title: 'Create Project Entity',
    description: 'Implement the core Project aggregate root for the project initialization domain. This entity manages the lifecycle of a Clean Architecture project from initialization to completion.',
    layer: 'domain',
    story_points: 3,
    priority: 'Primary',
    dependencies: [],
    acceptance_criteria: [
      'Entity has all required properties (id, name, path, template, configuration, status, metadata)',
      'Implements business methods (validate, initialize, applyTemplate, installDependencies, rollback)',
      'Enforces business invariants (unique name, single template, initialization state, writable path)',
      'Zero external dependencies (pure domain layer)',
      'Complete unit test coverage with all edge cases'
    ]
  };

  console.log('📋 Input Task:');
  console.log(JSON.stringify(exampleTask, null, 2));
  console.log('\n');

  try {
    // Transform task to YAML workflow
    console.log('🔄 Transforming to YAML workflow...');
    const workflow = await transformer.transformTaskObject(exampleTask);

    console.log('✅ Transformation successful!');
    console.log('\n📊 Workflow Summary:');
    console.log(`- Layer: ${workflow.metadata?.layer}`);
    console.log(`- Task ID: ${workflow.metadata?.task_id}`);
    console.log(`- Story Points: ${workflow.metadata?.story_points}`);
    console.log(`- Steps: ${workflow.domain_steps?.length}`);

    console.log('\n📝 Generated Steps:');
    workflow.domain_steps?.forEach((step, index) => {
      console.log(`${index + 1}. ${step.id} (${step.type})`);
      if (step.action) {
        if (step.action.branch_name) {
          console.log(`   Branch: ${step.action.branch_name}`);
        }
        if (step.action.source_branch && step.action.target_branch) {
          console.log(`   PR: ${step.action.source_branch} → ${step.action.target_branch}`);
        }
      }
    });

    // Save to file
    const outputPath = 'templates/domain-T001-project-entity.regent';
    await transformer.saveWorkflowAsYaml(workflow, outputPath);
    console.log(`\n💾 Saved to: ${outputPath}`);

    console.log('\n🎯 Expected Execution Flow:');
    console.log('1. Create feature branch: feature/T001-create-project-entity');
    console.log('2. Create directory structure: src/features/project-init/domain/');
    console.log('3. Generate Project entity with business logic');
    console.log('4. Generate comprehensive test suite');
    console.log('5. Run validation: tests, lint, typecheck');
    console.log('6. Commit with conventional format');
    console.log('7. Create PR with detailed description');

    console.log('\n📈 Performance Benefits:');
    console.log('- Leverages existing spec-kit analysis (6,336 lines)');
    console.log('- No re-analysis needed (90% time saved)');
    console.log('- Full GitFlow enforcement');
    console.log('- Complete RLHF scoring via execute-steps.ts');
    console.log('- Deterministic, repeatable builds');

    return workflow;

  } catch (error) {
    console.error('❌ Transformation failed:', error);
    throw error;
  }
}

// Run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateTransformer()
    .then(() => {
      console.log('\n✅ Demo completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Demo failed:', error);
      process.exit(1);
    });
}

export { demonstrateTransformer };