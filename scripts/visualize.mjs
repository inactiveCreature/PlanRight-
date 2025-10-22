import { writeFileSync } from 'fs';
import { resolve } from 'path';

// Generate bundle analysis report
const statsHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Bundle Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .note { color: #666; font-style: italic; }
    </style>
</head>
<body>
    <h1>Bundle Analysis Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p>Bundle analysis completed. Check the dist/ directory for detailed visualizations.</p>
        <p class="note">Note: This is a placeholder report. The actual rollup-plugin-visualizer output will be generated during the build process.</p>
    </div>
</body>
</html>
`;

writeFileSync(resolve('dist/stats.html'), statsHtml);
console.log('Bundle analysis report generated at dist/stats.html');
