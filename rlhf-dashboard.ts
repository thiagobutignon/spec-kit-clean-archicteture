#!/usr/bin/env tsx

import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

/**
 * RLHF Analytics Dashboard
 * Visualizes learning metrics, improvements, and score distributions
 * Score Range: -2 (Catastrophic) to +2 (Perfect)
 */

class RLHFDashboard {
  private dataDir = '.rlhf';

  async display(): Promise<void> {
    console.clear();
    console.log(chalk.cyan.bold('═'.repeat(80)));
    console.log(chalk.cyan.bold('                     🤖 RLHF Learning Dashboard'));
    console.log(chalk.cyan.bold('═'.repeat(80)));

    await this.displayMetricsSummary();
    await this.displayRLHFScoreDistribution();
    await this.displayPatternAnalysis();
    await this.displayImprovementStatus();
    await this.displayRecommendations();

    console.log(chalk.cyan.bold('═'.repeat(80)));
  }

  private async displayMetricsSummary(): Promise<void> {
    const metricsFile = path.join(this.dataDir, 'metrics.json');

    if (!await fs.pathExists(metricsFile)) {
      console.log(chalk.yellow('\n📊 No metrics data available yet.'));
      return;
    }

    const metrics = await fs.readJson(metricsFile);

    const totalRuns = metrics.length;
    const successCount = metrics.filter((m: any) => m.success).length;
    const successRate = totalRuns > 0 ? (successCount / totalRuns * 100).toFixed(1) : 0;

    // Calculate average duration
    const avgDuration = metrics.reduce((acc: number, m: any) => acc + m.duration, 0) / totalRuns;

    // Calculate average RLHF score
    const avgRLHFScore = metrics.reduce((acc: number, m: any) =>
      acc + (m.rlhfScore || 0), 0) / totalRuns;

    // Group errors by type
    const errorTypes: Record<string, number> = {};
    metrics.filter((m: any) => !m.success).forEach((m: any) => {
      errorTypes[m.errorType || 'unknown'] = (errorTypes[m.errorType || 'unknown'] || 0) + 1;
    });

    console.log(chalk.white.bold('\n📈 Execution Metrics:'));
    console.log(chalk.white('─'.repeat(40)));

    console.log(chalk.green(`  ✅ Success Rate: ${successRate}% (${successCount}/${totalRuns})`));
    console.log(chalk.blue(`  ⏱️  Avg Duration: ${avgDuration.toFixed(0)}ms`));
    console.log(chalk.magenta(`  📝 Total Executions: ${totalRuns}`));
    console.log(this.getRLHFScoreColor(avgRLHFScore)(`  🏆 Avg RLHF Score: ${avgRLHFScore.toFixed(2)}/2`));

    if (Object.keys(errorTypes).length > 0) {
      console.log(chalk.red('\n  ❌ Error Breakdown:'));
      Object.entries(errorTypes)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .forEach(([type, count]) => {
          const percentage = ((count / (totalRuns - successCount)) * 100).toFixed(1);
          const bar = this.createBar(parseInt(percentage), 20);
          console.log(chalk.red(`     ${type.padEnd(20)} ${bar} ${count} (${percentage}%)`));
        });
    }
  }

  private async displayRLHFScoreDistribution(): Promise<void> {
    const metricsFile = path.join(this.dataDir, 'metrics.json');

    if (!await fs.pathExists(metricsFile)) {
      return;
    }

    const metrics = await fs.readJson(metricsFile);

    // Count score distribution
    const scoreDistribution: Record<string, number> = {
      'catastrophic (-2)': 0,
      'runtime error (-1)': 0,
      'low confidence (0)': 0,
      'good (+1)': 0,
      'perfect (+2)': 0
    };

    metrics.forEach((m: any) => {
      const score = m.rlhfScore || 0;
      if (score <= -2) scoreDistribution['catastrophic (-2)']++;
      else if (score <= -1) scoreDistribution['runtime error (-1)']++;
      else if (score <= 0) scoreDistribution['low confidence (0)']++;
      else if (score <= 1) scoreDistribution['good (+1)']++;
      else scoreDistribution['perfect (+2)']++;
    });

    console.log(chalk.white.bold('\n🎯 RLHF Score Distribution:'));
    console.log(chalk.white('─'.repeat(40)));

    Object.entries(scoreDistribution).forEach(([level, count]) => {
      const percentage = metrics.length > 0 ? (count / metrics.length * 100).toFixed(1) : '0';
      const bar = this.createBar(parseFloat(percentage), 20, this.getScoreBarColor(level));
      const emoji = this.getScoreEmoji(level);
      console.log(`  ${emoji} ${level.padEnd(20)} ${bar} ${count} (${percentage}%)`);
    });

    // Show score trend
    if (metrics.length > 5) {
      const recentScores = metrics.slice(-5).map((m: any) => m.rlhfScore || 0);
      const avgRecent = recentScores.reduce((a: number, b: number) => a + b, 0) / recentScores.length;
      const oldScores = metrics.slice(0, 5).map((m: any) => m.rlhfScore || 0);
      const avgOld = oldScores.reduce((a: number, b: number) => a + b, 0) / oldScores.length;
      const trend = avgRecent - avgOld;

      if (trend > 0.1) {
        console.log(chalk.green(`\n  📈 Score Trend: Improving (+${trend.toFixed(2)})`));
      } else if (trend < -0.1) {
        console.log(chalk.red(`\n  📉 Score Trend: Declining (${trend.toFixed(2)})`));
      } else {
        console.log(chalk.yellow(`\n  ➡️ Score Trend: Stable`));
      }
    }
  }

  private getScoreEmoji(level: string): string {
    if (level.includes('-2')) return '💥';
    if (level.includes('-1')) return '❌';
    if (level.includes('0')) return '⚠️';
    if (level.includes('+1')) return '✅';
    if (level.includes('+2')) return '🏆';
    return '❓';
  }

  private getScoreBarColor(level: string): string {
    if (level.includes('-2')) return 'red';
    if (level.includes('-1')) return 'red';
    if (level.includes('0')) return 'yellow';
    if (level.includes('+1')) return 'green';
    if (level.includes('+2')) return 'green';
    return 'blue';
  }

  private getRLHFScoreColor(score: number): any {
    if (score >= 1.5) return chalk.green.bold;
    if (score >= 0.5) return chalk.green;
    if (score >= -0.5) return chalk.yellow;
    if (score >= -1.5) return chalk.red;
    return chalk.red.bold;
  }

  private async displayPatternAnalysis(): Promise<void> {
    const patternsFile = path.join(this.dataDir, 'patterns.json');

    if (!await fs.pathExists(patternsFile)) {
      return;
    }

    const patterns = await fs.readJson(patternsFile);

    console.log(chalk.white.bold('\n🔍 Pattern Analysis:'));
    console.log(chalk.white('─'.repeat(40)));

    // Find problematic patterns
    const problematicPatterns = Object.values(patterns)
      .filter((p: any) => p.successRate < 0.5 && p.occurrences > 2)
      .sort((a: any, b: any) => a.successRate - b.successRate);

    if (problematicPatterns.length > 0) {
      console.log(chalk.yellow('  ⚠️  Problematic Patterns:'));
      problematicPatterns.slice(0, 5).forEach((p: any) => {
        const successPercent = (p.successRate * 100).toFixed(1);
        const bar = this.createBar(p.successRate * 100, 20, 'red');
        console.log(chalk.yellow(`     ${p.pattern.padEnd(30)} ${bar} ${successPercent}% success`));

        if (p.suggestedFix) {
          console.log(chalk.gray(`       → Suggestion: ${p.suggestedFix}`));
        }
      });
    }

    // Find successful patterns
    const successfulPatterns = Object.values(patterns)
      .filter((p: any) => p.successRate > 0.8 && p.occurrences > 2)
      .sort((a: any, b: any) => b.occurrences - a.occurrences);

    if (successfulPatterns.length > 0) {
      console.log(chalk.green('\n  ✨ Successful Patterns:'));
      successfulPatterns.slice(0, 3).forEach((p: any) => {
        const successPercent = (p.successRate * 100).toFixed(1);
        const bar = this.createBar(p.successRate * 100, 20, 'green');
        console.log(chalk.green(`     ${p.pattern.padEnd(30)} ${bar} ${successPercent}% success`));
      });
    }
  }

  private async displayImprovementStatus(): Promise<void> {
    const improvementsFile = path.join(this.dataDir, 'improvements.json');
    const appliedFile = path.join(this.dataDir, 'applied-improvements.json');

    if (!await fs.pathExists(improvementsFile)) {
      return;
    }

    const improvements = await fs.readJson(improvementsFile);
    const applied = await fs.pathExists(appliedFile) ? await fs.readJson(appliedFile) : [];

    console.log(chalk.white.bold('\n🚀 Improvement Status:'));
    console.log(chalk.white('─'.repeat(40)));

    const pendingImprovements = improvements.filter((i: any) => !i.appliedAt);
    const appliedImprovements = improvements.filter((i: any) => i.appliedAt);

    console.log(chalk.blue(`  📋 Pending Improvements: ${pendingImprovements.length}`));
    console.log(chalk.green(`  ✅ Applied Improvements: ${appliedImprovements.length}`));

    if (pendingImprovements.length > 0) {
      console.log(chalk.yellow('\n  🔧 Ready to Apply:'));
      pendingImprovements.slice(0, 3).forEach((imp: any) => {
        const confidence = (imp.confidence * 100).toFixed(0);
        console.log(chalk.yellow(`     • ${imp.problemPattern}`));
        console.log(chalk.gray(`       Solution: ${imp.solution} (${confidence}% confidence)`));
      });
    }
  }

  private async displayRecommendations(): Promise<void> {
    const reportFile = path.join(this.dataDir, 'learning-report.json');

    if (!await fs.pathExists(reportFile)) {
      return;
    }

    const report = await fs.readJson(reportFile);

    console.log(chalk.white.bold('\n💡 Recommendations:'));
    console.log(chalk.white('─'.repeat(40)));

    const recommendations = [];

    // Check RLHF score
    if (report.summary.avgRLHFScore && report.summary.avgRLHFScore < 0) {
      recommendations.push({
        priority: 'high',
        message: `Average RLHF score is negative (${report.summary.avgRLHFScore.toFixed(2)}). Critical improvements needed.`,
        action: 'Review architecture violations and apply RLHF learnings'
      });
    } else if (report.summary.avgRLHFScore && report.summary.avgRLHFScore < 1) {
      recommendations.push({
        priority: 'medium',
        message: `RLHF score below +1 (${report.summary.avgRLHFScore.toFixed(2)}). Room for improvement.`,
        action: 'Add domain documentation and ubiquitous language'
      });
    }

    // Check success rate
    if (report.summary.successRate < 0.7) {
      recommendations.push({
        priority: 'high',
        message: 'Success rate below 70%. Run apply-rlhf-learnings to implement fixes.',
        action: 'npx tsx rlhf-system.ts apply'
      });
    }

    // Check for recurring errors
    const topError = Object.entries(report.summary.commonErrors || {})
      .sort(([, a]: any, [, b]: any) => b - a)[0];

    if (topError && topError[1] > 3) {
      recommendations.push({
        priority: 'medium',
        message: `"${topError[0]}" errors occurring frequently (${topError[1]} times).`,
        action: 'Review and update validation scripts'
      });
    }

    // Check for slow steps
    if (report.summary.avgDuration > 5000) {
      recommendations.push({
        priority: 'low',
        message: 'Average execution time exceeds 5 seconds.',
        action: 'Consider optimizing validation scripts'
      });
    }

    if (recommendations.length === 0) {
      console.log(chalk.green('  ✨ System is performing optimally!'));
    } else {
      recommendations.forEach(rec => {
        const icon = rec.priority === 'high' ? '🔴' :
                     rec.priority === 'medium' ? '🟡' : '🟢';
        console.log(chalk.white(`  ${icon} ${rec.message}`));
        if (rec.action) {
          console.log(chalk.gray(`     → Action: ${rec.action}`));
        }
      });
    }
  }

  private createBar(percentage: number, width: number, color: string = 'blue'): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;

    const colors: Record<string, any> = {
      'red': chalk.red,
      'green': chalk.green,
      'blue': chalk.blue,
      'yellow': chalk.yellow
    };

    const colorFn = colors[color] || chalk.blue;

    return colorFn('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }

  async exportHtml(): Promise<void> {
    const metricsFile = path.join(this.dataDir, 'metrics.json');
    const patternsFile = path.join(this.dataDir, 'patterns.json');

    if (!await fs.pathExists(metricsFile)) {
      console.log(chalk.yellow('No data to export'));
      return;
    }

    const metrics = await fs.readJson(metricsFile);
    const patterns = await fs.pathExists(patternsFile) ? await fs.readJson(patternsFile) : {};

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>RLHF Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #1e1e1e;
      color: #e0e0e0;
    }
    h1 { color: #00bcd4; }
    .container { max-width: 1200px; margin: 0 auto; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .card {
      background: #2d2d2d;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    }
    canvas { max-height: 300px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🤖 RLHF Learning Dashboard</h1>

    <div class="grid">
      <div class="card">
        <h2>Success Rate Over Time</h2>
        <canvas id="successChart"></canvas>
      </div>

      <div class="card">
        <h2>Error Distribution</h2>
        <canvas id="errorChart"></canvas>
      </div>

      <div class="card">
        <h2>Step Performance</h2>
        <canvas id="performanceChart"></canvas>
      </div>

      <div class="card">
        <h2>RLHF Score Progress</h2>
        <canvas id="rlhfScoreChart"></canvas>
      </div>
    </div>
  </div>

  <script>
    const metricsData = ${JSON.stringify(metrics)};
    const patternsData = ${JSON.stringify(patterns)};

    // Success Rate and RLHF Score Chart
    new Chart(document.getElementById('successChart'), {
      type: 'line',
      data: {
        labels: metricsData.slice(-20).map((_, i) => 'Run ' + (i + 1)),
        datasets: [{
          label: 'Success Rate',
          data: metricsData.slice(-20).map(m => m.success ? 100 : 0),
          borderColor: '#4caf50',
          tension: 0.4,
          yAxisID: 'y'
        }, {
          label: 'RLHF Score',
          data: metricsData.slice(-20).map(m => ((m.rlhfScore || 0) + 2) * 25),
          borderColor: '#00bcd4',
          tension: 0.4,
          yAxisID: 'y'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#e0e0e0' } } },
        scales: {
          y: {
            ticks: { color: '#e0e0e0' },
            grid: { color: '#444' },
            min: 0,
            max: 100
          },
          x: { ticks: { color: '#e0e0e0' }, grid: { color: '#444' } }
        }
      }
    });

    // RLHF Score Distribution
    const scoreDistribution = [-2, -1, 0, 1, 2].map(score =>
      metricsData.filter(m => Math.round(m.rlhfScore || 0) === score).length
    );

    new Chart(document.getElementById('rlhfScoreChart'), {
      type: 'bar',
      data: {
        labels: ['Catastrophic (-2)', 'Runtime Error (-1)', 'Low Confidence (0)', 'Good (+1)', 'Perfect (+2)'],
        datasets: [{
          label: 'Score Distribution',
          data: scoreDistribution,
          backgroundColor: ['#d32f2f', '#f44336', '#ffeb3b', '#8bc34a', '#4caf50']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { color: '#e0e0e0' }, grid: { color: '#444' } },
          x: { ticks: { color: '#e0e0e0' }, grid: { color: '#444' } }
        }
      }
    });

    // Error Distribution
    const errorCounts = {};
    metricsData.filter(m => !m.success).forEach(m => {
      errorCounts[m.errorType || 'unknown'] = (errorCounts[m.errorType || 'unknown'] || 0) + 1;
    });

    new Chart(document.getElementById('errorChart'), {
      type: 'doughnut',
      data: {
        labels: Object.keys(errorCounts),
        datasets: [{
          data: Object.values(errorCounts),
          backgroundColor: ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#e0e0e0' } } }
      }
    });
  </script>
</body>
</html>`;

    const outputPath = 'rlhf-dashboard.html';
    await fs.writeFile(outputPath, html);
    console.log(chalk.green(`\n✅ Dashboard exported to ${outputPath}`));
    console.log(chalk.blue(`   Open in browser: file://${path.resolve(outputPath)}`));
  }
}

async function main() {
  const dashboard = new RLHFDashboard();
  const command = process.argv[2];

  if (command === 'export') {
    await dashboard.exportHtml();
  } else {
    await dashboard.display();
    console.log(chalk.gray('\n💡 Tip: Run `npx tsx rlhf-dashboard.ts export` to generate HTML report'));
  }
}

// Check if running as main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { RLHFDashboard };