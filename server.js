/**
 * Central Dashboard for Bot Monitoring
 * Scans /opt/dev/projects/ for bot projects and displays their status
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5001;
const BASE_PATH = '/opt/dev/projects';
const EXCLUDE_DIRS = ['.git', '__pycache__', 'node_modules', 'venv', '.venv'];

// Check if directory is a bot project (contains bot.py)
function isBotDirectory(dirPath) {
    const botFile = path.join(dirPath, 'bot.py');
    return fs.existsSync(botFile);
}

// Get bot status from directory
function getBotStatus(botDir) {
    const botName = path.basename(botDir);
    const status = {
        name: botName,
        lastRun: null,
        lastRunAgo: null,
        status: 'unknown',
        message: 'No logs found'
    };

    // Look for logs directory
    const logsDir = path.join(botDir, 'logs');
    if (fs.existsSync(logsDir)) {
        const logFiles = fs.readdirSync(logsDir)
            .filter(f => f.endsWith('.log'))
            .map(f => path.join(logsDir, f));

        if (logFiles.length > 0) {
            // Get most recent log file
            const latestLog = logFiles.reduce((a, b) => {
                return fs.statSync(a).mtime > fs.statSync(b).mtime ? a : b;
            });

            const stats = fs.statSync(latestLog);
            status.lastRun = stats.mtime.toISOString();
            
            // Calculate time ago
            const secondsAgo = Math.floor((Date.now() - stats.mtime) / 1000);
            if (secondsAgo < 60) {
                status.lastRunAgo = `${secondsAgo} detik lalu`;
            } else if (secondsAgo < 3600) {
                status.lastRunAgo = `${Math.floor(secondsAgo / 60)} menit lalu`;
            } else if (secondsAgo < 86400) {
                status.lastRunAgo = `${Math.floor(secondsAgo / 3600)} jam lalu`;
            } else {
                status.lastRunAgo = `${Math.floor(secondsAgo / 86400)} hari lalu`;
            }

            // Read last line of log
            try {
                const content = fs.readFileSync(latestLog, 'utf8');
                const lines = content.trim().split('\n');
                if (lines.length > 0) {
                    const lastLine = lines[lines.length - 1].substring(0, 200);
                    status.message = lastLine;

                    // Determine status from message
                    const lowerLine = lastLine.toLowerCase();
                    if (lowerLine.includes('berhasil') || lowerLine.includes('success') || lowerLine.includes('sukses')) {
                        status.status = 'success';
                    } else if (lowerLine.includes('gagal') || lowerLine.includes('failed') || lowerLine.includes('error')) {
                        status.status = 'error';
                    } else {
                        status.status = 'info';
                    }
                }
            } catch (e) {
                status.message = 'Error reading log';
            }
        }
    }

    // Fallback: check bot.py modification time
    if (!status.lastRun) {
        const botPy = path.join(botDir, 'bot.py');
        if (fs.existsSync(botPy)) {
            const stats = fs.statSync(botPy);
            status.lastRun = stats.mtime.toISOString();
            
            const secondsAgo = Math.floor((Date.now() - stats.mtime) / 1000);
            if (secondsAgo < 60) {
                status.lastRunAgo = `${secondsAgo} detik lalu`;
            } else if (secondsAgo < 3600) {
                status.lastRunAgo = `${Math.floor(secondsAgo / 60)} menit lalu`;
            } else if (secondsAgo < 86400) {
                status.lastRunAgo = `${Math.floor(secondsAgo / 3600)} jam lalu`;
            } else {
                status.lastRunAgo = `${Math.floor(secondsAgo / 86400)} hari lalu`;
            }
            status.message = 'Bot file modified (no logs)';
            status.status = 'idle';
        }
    }

    return status;
}

// Get all bots
function getAllBots() {
    const bots = [];
    
    if (fs.existsSync(BASE_PATH)) {
        const dirs = fs.readdirSync(BASE_PATH);
        
        for (const dir of dirs) {
            const fullPath = path.join(BASE_PATH, dir);
            
            if (fs.statSync(fullPath).isDirectory() && !EXCLUDE_DIRS.includes(dir)) {
                if (isBotDirectory(fullPath)) {
                    bots.push(getBotStatus(fullPath));
                }
            }
        }
    }
    
    return bots.sort((a, b) => a.name.localeCompare(b.name));
}

// HTML Template
function getHTMLTemplate(bots) {
    const botRows = bots.map(bot => `
        <tr>
            <td><strong>${bot.name}</strong></td>
            <td>${bot.lastRunAgo || 'Belum pernah'}</td>
            <td class="status-${bot.status}">${bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}</td>
            <td>${bot.message}</td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Bot Pusat</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            min-height: 100vh;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 12px; 
            box-shadow: 0 10px 40px rgba(0,0,0,0.2); 
        }
        h1 { 
            color: #2c3e50; 
            text-align: center; 
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        .subtitle {
            text-align: center;
            color: #7f8c8d;
            margin-bottom: 30px;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        th, td { 
            padding: 15px; 
            text-align: left; 
        }
        th { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            font-weight: 600;
        }
        tr:nth-child(even) { background-color: #f8f9fa; }
        tr:hover { background-color: #e9ecef; }
        .status-success { color: #27ae60; font-weight: bold; }
        .status-error { color: #e74c3c; font-weight: bold; }
        .status-info { color: #f39c12; font-weight: bold; }
        .status-idle { color: #9b59b6; font-weight: bold; }
        .status-unknown { color: #95a5a6; font-weight: bold; }
        .refresh-btn { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 6px; 
            cursor: pointer; 
            font-size: 1em;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .refresh-btn:hover { 
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .header-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .stats {
            display: flex;
            gap: 20px;
            margin-top: 20px;
        }
        .stat-card {
            flex: 1;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            color: #2c3e50;
        }
        .stat-label {
            color: #7f8c8d;
            margin-top: 5px;
        }
        .footer {
            text-align: center;
            color: #7f8c8d;
            margin-top: 30px;
            font-size: 0.9em;
        }
    </style>
    <script>
        function refreshPage() { location.reload(); }
        setTimeout(refreshPage, 30000);
    </script>
</head>
<body>
    <div class="container">
        <h1>🤖 Dashboard Bot Pusat</h1>
        <p class="subtitle">Memantau semua bot automation dalam satu tempat</p>
        
        <div class="header-bar">
            <span>Terakhir diperbarui: ${new Date().toLocaleString('id-ID')}</span>
            <button class="refresh-btn" onclick="refreshPage()">🔄 Segarkan</button>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${bots.length}</div>
                <div class="stat-label">Total Bot</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${bots.filter(b => b.status === 'success').length}</div>
                <div class="stat-label">Berhasil</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${bots.filter(b => b.status === 'error').length}</div>
                <div class="stat-label">Error</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Nama Bot</th>
                    <th>Terakhir Jalankan</th>
                    <th>Status</th>
                    <th>Pesan</th>
                </tr>
            </thead>
            <tbody>
                ${botRows || '<tr><td colspan="4" style="text-align:center;color:#95a5a6;">Tidak ada bot terdeteksi</td></tr>'}
            </tbody>
        </table>

        <div class="footer">
            Auto-refresh setiap 30 detik | Dibuat dengan ❤️ oleh Hermes AI
        </div>
    </div>
</body>
</html>
    `;
}

// Routes
app.get('/', (req, res) => {
    const bots = getAllBots();
    res.send(getHTMLTemplate(bots));
});

app.get('/api/bots', (req, res) => {
    const bots = getAllBots();
    res.json(bots);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 Bot Dashboard berjalan di:`);
    console.log(`   - http://localhost:${PORT}`);
    console.log(`   - http://192.168.10.8:${PORT}`);
    console.log(`\n📊 Memantau folder: ${BASE_PATH}`);
});
