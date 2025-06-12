#!/usr/bin/env node

const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

console.log('🔍 Festival Chat - ngrok Diagnostic Tool');
console.log('========================================\n');

// System Information
console.log('📊 System Information:');
console.log(`  OS: ${os.type()} ${os.release()}`);
console.log(`  Node Version: ${process.version}`);
console.log(`  Current Time: ${new Date().toISOString()}`);
console.log(`  Working Directory: ${process.cwd()}\n`);

// Check if ngrok is installed
exec('which ngrok', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ ngrok not found in PATH');
    console.log('\n📝 Installation Instructions:');
    console.log('  1. Visit https://ngrok.com/download');
    console.log('  2. Download ngrok for your OS');
    console.log('  3. Extract and add to PATH');
    console.log('  4. Run: ngrok authtoken YOUR_TOKEN\n');
    generateReport('ngrok_not_installed');
    return;
  }

  console.log('✅ ngrok found at:', stdout.trim());
  
  // Check ngrok tunnels
  exec('curl -s http://localhost:4040/api/tunnels', (error, stdout, stderr) => {
    if (error) {
      console.log('\n⚠️  ngrok is not running');
      console.log('\n📝 To start ngrok:');
      console.log('  1. Open a new terminal');
      console.log('  2. Run: ngrok http 3000');
      console.log('  3. Keep it running while developing\n');
      generateReport('ngrok_not_running');
      return;
    }

    try {
      const data = JSON.parse(stdout);
      console.log('\n✅ ngrok is running!');
      console.log(`\n🌐 Active Tunnels (${data.tunnels.length}):`);
      
      data.tunnels.forEach((tunnel, index) => {
        console.log(`\n  Tunnel ${index + 1}:`);
        console.log(`    Name: ${tunnel.name}`);
        console.log(`    URL: ${tunnel.public_url}`);
        console.log(`    Protocol: ${tunnel.proto}`);
        console.log(`    Forwarding to: ${tunnel.config.addr}`);
      });

      const httpsUrl = data.tunnels.find(t => t.public_url.startsWith('https'))?.public_url;
      if (httpsUrl) {
        console.log('\n🎯 Your HTTPS URL for mobile testing:');
        console.log(`   ${httpsUrl}`);
        console.log('\n📱 Mobile Setup:');
        console.log('  1. Open this URL on your phone');
        console.log('  2. Navigate to /admin or scan QR code');
        console.log('  3. Both devices must join same room\n');
      }

      generateReport('ngrok_running', data);
    } catch (e) {
      console.log('❌ Error parsing ngrok response:', e.message);
      generateReport('ngrok_error', { error: e.message });
    }
  });
});

function generateReport(status, data = {}) {
  const report = {
    timestamp: new Date().toISOString(),
    status,
    system: {
      os: `${os.type()} ${os.release()}`,
      node: process.version,
      cwd: process.cwd()
    },
    data,
    nextSteps: getNextSteps(status)
  };

  // Save report to file
  const reportPath = path.join(process.cwd(), 'ngrok-diagnostic-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);

  // Generate HTML report
  const htmlReport = generateHTMLReport(report);
  const htmlPath = path.join(process.cwd(), 'ngrok-diagnostic-report.html');
  fs.writeFileSync(htmlPath, htmlReport);
  console.log(`📄 HTML report saved to: ${htmlPath}`);

  // Try to open in browser
  const openCommand = process.platform === 'darwin' ? 'open' : 
                      process.platform === 'win32' ? 'start' : 'xdg-open';
  
  exec(`${openCommand} ${htmlPath}`, (error) => {
    if (!error) {
      console.log('\n🌐 Opening report in browser...');
    }
  });
}

function getNextSteps(status) {
  switch (status) {
    case 'ngrok_not_installed':
      return [
        'Install ngrok from https://ngrok.com/download',
        'Add ngrok to your PATH',
        'Create a free ngrok account',
        'Run: ngrok authtoken YOUR_TOKEN',
        'Run this diagnostic again'
      ];
    case 'ngrok_not_running':
      return [
        'Open a new terminal window',
        'Navigate to your project directory',
        'Run: ngrok http 3000',
        'Keep ngrok running while developing',
        'Run this diagnostic again'
      ];
    case 'ngrok_running':
      return [
        'Copy the HTTPS URL from above',
        'Open it on your mobile device',
        'Make sure both devices join the same room',
        'Test the P2P connection'
      ];
    default:
      return ['Check the error details above'];
  }
}

function generateHTMLReport(report) {
  const statusColor = report.status === 'ngrok_running' ? '#22c55e' : '#ef4444';
  const statusEmoji = report.status === 'ngrok_running' ? '✅' : '❌';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Festival Chat - ngrok Diagnostic Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f9fafb;
        }
        h1 {
            color: #1e293b;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
        }
        .status {
            background: ${statusColor};
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 18px;
            font-weight: bold;
        }
        .section {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .section h2 {
            margin-top: 0;
            color: #374151;
        }
        pre {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
        }
        .next-steps {
            background: #fef3c7;
            border: 1px solid #fbbf24;
            padding: 15px;
            border-radius: 8px;
        }
        .next-steps ol {
            margin: 10px 0;
            padding-left: 20px;
        }
        .copy-button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
        .copy-button:hover {
            background: #2563eb;
        }
        .tunnel-info {
            background: #e0f2fe;
            border: 1px solid #0284c7;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <h1>🔍 Festival Chat - ngrok Diagnostic Report</h1>
    
    <div class="status">
        ${statusEmoji} Status: ${report.status.replace(/_/g, ' ').toUpperCase()}
    </div>

    <div class="section">
        <h2>📊 System Information</h2>
        <pre>${JSON.stringify(report.system, null, 2)}</pre>
        <p>Generated at: ${report.timestamp}</p>
    </div>

    ${report.status === 'ngrok_running' && report.data.tunnels ? `
        <div class="section">
            <h2>🌐 Active Tunnels</h2>
            ${report.data.tunnels.map(tunnel => `
                <div class="tunnel-info">
                    <h3>${tunnel.name}</h3>
                    <p><strong>URL:</strong> ${tunnel.public_url}</p>
                    <p><strong>Forwarding to:</strong> ${tunnel.config.addr}</p>
                    ${tunnel.public_url.startsWith('https') ? `
                        <button class="copy-button" onclick="copyToClipboard('${tunnel.public_url}')">
                            Copy HTTPS URL
                        </button>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    ` : ''}

    <div class="section next-steps">
        <h2>📝 Next Steps</h2>
        <ol>
            ${report.nextSteps.map(step => `<li>${step}</li>`).join('')}
        </ol>
    </div>

    <div class="section">
        <h2>🤖 Share with Claude</h2>
        <p>Copy this entire report and paste it into Claude for debugging help:</p>
        <button class="copy-button" onclick="copyReport()">Copy Full Report</button>
        <pre id="report-json">${JSON.stringify(report, null, 2)}</pre>
    </div>

    <script>
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                alert('Copied to clipboard!');
            });
        }

        function copyReport() {
            const reportText = document.getElementById('report-json').textContent;
            copyToClipboard(reportText);
        }
    </script>
</body>
</html>`;
}
