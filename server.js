/**
 * Central Dashboard for Bot Monitoring
 * Futuristic cyberpunk theme - neon glow, glass morphism, dark mode
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5001;
const BASE_PATH = '/opt/dev/projects';
const EXCLUDE_DIRS = ['.git', '__pycache__', 'node_modules', 'venv', '.venv'];

// Check if directory is a bot project
function isBotDirectory(dirPath) {
    return fs.existsSync(path.join(dirPath, 'bot.py'));
}

// Get bot status
function getBotStatus(botDir) {
    const botName = path.basename(botDir);
    const status = {
        name: botName,
        lastRun: null,
        lastRunAgo: null,
        status: 'unknown',
        message: 'No logs found'
    };

    const logsDir = path.join(botDir, 'logs');
    if (fs.existsSync(logsDir)) {
        const logFiles = fs.readdirSync(logsDir)
            .filter(f => f.endsWith('.log'))
            .map(f => path.join(logsDir, f));

        if (logFiles.length > 0) {
            const latestLog = logFiles.reduce((a, b) => 
                fs.statSync(a).mtime > fs.statSync(b).mtime ? a : b
            );

            const stats = fs.statSync(latestLog);
            status.lastRun = stats.mtime.toISOString();
            
            const secondsAgo = Math.floor((Date.now() - stats.mtime) / 1000);
            if (secondsAgo < 60) status.lastRunAgo = `${secondsAgo}s ago`;
            else if (secondsAgo < 3600) status.lastRunAgo = `${Math.floor(secondsAgo/60)}m ago`;
            else if (secondsAgo < 86400) status.lastRunAgo = `${Math.floor(secondsAgo/3600)}h ago`;
            else status.lastRunAgo = `${Math.floor(secondsAgo/86400)}d ago`;

            try {
                const content = fs.readFileSync(latestLog, 'utf8');
                const lines = content.trim().split('\n');
                if (lines.length > 0) {
                    const lastLine = lines[lines.length - 1].substring(0, 200);
                    status.message = lastLine;

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

    if (!status.lastRun) {
        const botPy = path.join(botDir, 'bot.py');
        if (fs.existsSync(botPy)) {
            const stats = fs.statSync(botPy);
            status.lastRun = stats.mtime.toISOString();
            const secondsAgo = Math.floor((Date.now() - stats.mtime) / 1000);
            if (secondsAgo < 60) status.lastRunAgo = `${secondsAgo}s ago`;
            else if (secondsAgo < 3600) status.lastRunAgo = `${Math.floor(secondsAgo/60)}m ago`;
            else if (secondsAgo < 86400) status.lastRunAgo = `${Math.floor(secondsAgo/3600)}h ago`;
            else status.lastRunAgo = `${Math.floor(secondsAgo/86400)}d ago`;
            status.message = 'Bot idle (no logs)';
            status.status = 'idle';
        }
    }

    return status;
}

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

// Futuristic Dashboard HTML
function getFuturisticHTML(bots) {
    const successCount = bots.filter(b => b.status === 'success').length;
    const errorCount = bots.filter(b => b.status === 'error').length;
    const activeCount = bots.filter(b => b.status !== 'idle' && b.status !== 'unknown').length;

    const botCards = bots.map(bot => {
        const statusColor = {
            success: '#00ff88',
            error: '#ff0066',
            info: '#00d4ff',
            idle: '#8b5cf6',
            unknown: '#6b7280'
        }[bot.status] || '#6b7280';

        const statusIcon = {
            success: '✓',
            error: '✕',
            info: '◐',
            idle: '○',
            unknown: '?'
        }[bot.status] || '?';

        const statusGlow = bot.status === 'success' ? '0 0 20px rgba(0,255,136,0.5)' :
                          bot.status === 'error' ? '0 0 20px rgba(255,0,102,0.5)' :
                          '0 0 20px rgba(0,212,255,0.3)';

        return `
        <div class="bot-card" style="--status-color: ${statusColor}; --status-glow: ${statusGlow}">
            <div class="bot-header">
                <div class="bot-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="10" rx="2"/>
                        <circle cx="12" cy="5" r="3"/>
                        <path d="M12 8v3"/>
                    </svg>
                </div>
                <div class="bot-name">${bot.name}</div>
                <div class="status-badge" style="background: ${statusColor}20; border: 1px solid ${statusColor}; box-shadow: ${statusGlow}">
                    <span class="status-icon">${statusIcon}</span>
                    <span class="status-text">${bot.status.toUpperCase()}</span>
                </div>
            </div>
            <div class="bot-body">
                <div class="bot-info">
                    <div class="info-item">
                        <span class="info-label">LAST RUN</span>
                        <span class="info-value">${bot.lastRunAgo || 'Never'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">STATUS</span>
                        <span class="info-value" style="color: ${statusColor}">${bot.status}</span>
                    </div>
                </div>
                <div class="bot-message">
                    <span class="message-label">MESSAGE</span>
                    <p>${bot.message}</p>
                </div>
            </div>
            <div class="bot-footer">
                <div class="pulse" style="background: ${statusColor}"></div>
                <span class="timestamp">${bot.lastRun ? new Date(bot.lastRun).toLocaleTimeString('id-ID') : '--:--:--'}</span>
            </div>
        </div>`;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOT NEXUS // Central Command</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap');

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary: #00d4ff;
            --secondary: #00ff88;
            --danger: #ff0066;
            --warning: #ffaa00;
            --bg-dark: #0a0e17;
            --bg-card: rgba(15, 23, 42, 0.6);
            --text-primary: #e2e8f0;
            --text-secondary: #94a3b8;
            --border: rgba(0, 212, 255, 0.2);
        }

        body {
            font-family: 'Rajdhani', sans-serif;
            background: var(--bg-dark);
            color: var(--text-primary);
            min-height: 100vh;
            overflow-x: hidden;
        }

        /* Animated Background */
        .bg-animation {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            background: 
                radial-gradient(ellipse at 20% 30%, rgba(0, 212, 255, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 70%, rgba(138, 43, 226, 0.1) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, rgba(0, 255, 136, 0.05) 0%, transparent 70%);
        }

        .grid-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            background-image: 
                linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
            background-size: 50px 50px;
            animation: gridMove 20s linear infinite;
        }

        @keyframes gridMove {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
        }

        /* Header */
        .header {
            padding: 30px 40px;
            border-bottom: 1px solid var(--border);
            backdrop-filter: blur(10px);
            background: rgba(10, 14, 23, 0.8);
        }

        .header-content {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .logo-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 30px rgba(0, 212, 255, 0.3);
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.3); }
            50% { box-shadow: 0 0 40px rgba(0, 212, 255, 0.6); }
        }

        .logo-icon svg {
            color: var(--bg-dark);
        }

        .logo-text {
            font-family: 'Orbitron', sans-serif;
        }

        .logo-text h1 {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 4px;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
        }

        .logo-text span {
            font-size: 11px;
            color: var(--text-secondary);
            letter-spacing: 3px;
            text-transform: uppercase;
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .status-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid var(--secondary);
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 1px;
        }

        .status-indicator::before {
            content: '';
            width: 8px;
            height: 8px;
            background: var(--secondary);
            border-radius: 50%;
            animation: blink 1s ease-in-out infinite;
        }

        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }

        .refresh-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            background: transparent;
            border: 1px solid var(--primary);
            color: var(--primary);
            font-family: 'Orbitron', sans-serif;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 2px;
            cursor: pointer;
            transition: all 0.3s ease;
            border-radius: 8px;
        }

        .refresh-btn:hover {
            background: var(--primary);
            color: var(--bg-dark);
            box-shadow: 0 0 30px rgba(0, 212, 255, 0.4);
        }

        /* Main Content */
        .main {
            max-width: 1400px;
            margin: 0 auto;
            padding: 40px;
        }

        /* Stats Section */
        .stats-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }

        .stat-card {
            background: var(--bg-card);
            backdrop-filter: blur(10px);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 25px;
            position: relative;
            overflow: hidden;
        }

        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
        }

        .stat-card.danger::before {
            background: linear-gradient(90deg, var(--danger), var(--warning));
        }

        .stat-label {
            font-size: 11px;
            color: var(--text-secondary);
            letter-spacing: 2px;
            margin-bottom: 10px;
        }

        .stat-value {
            font-family: 'Orbitron', sans-serif;
            font-size: 36px;
            font-weight: 800;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .stat-card.danger .stat-value {
            background: linear-gradient(90deg, var(--danger), var(--warning));
            -webkit-background-clip: text;
        }

        /* Bots Grid */
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }

        .section-title {
            font-family: 'Orbitron', sans-serif;
            font-size: 18px;
            font-weight: 600;
            letter-spacing: 3px;
            color: var(--text-secondary);
        }

        .section-title span {
            color: var(--primary);
        }

        .bots-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
            gap: 25px;
        }

        /* Bot Card */
        .bot-card {
            background: var(--bg-card);
            backdrop-filter: blur(10px);
            border: 1px solid var(--border);
            border-radius: 16px;
            overflow: hidden;
            transition: all 0.3s ease;
            position: relative;
        }

        .bot-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: var(--status-color);
            box-shadow: var(--status-glow);
        }

        .bot-card:hover {
            transform: translateY(-5px);
            border-color: var(--status-color);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3), var(--status-glow);
        }

        .bot-header {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 20px;
            border-bottom: 1px solid var(--border);
        }

        .bot-icon {
            width: 40px;
            height: 40px;
            background: rgba(0, 212, 255, 0.1);
            border: 1px solid var(--primary);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--primary);
        }

        .bot-name {
            flex: 1;
            font-family: 'Orbitron', sans-serif;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 1px;
        }

        .status-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
        }

        .status-icon {
            font-size: 12px;
        }

        .bot-body {
            padding: 20px;
        }

        .bot-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }

        .info-item {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .info-label {
            font-size: 10px;
            color: var(--text-secondary);
            letter-spacing: 2px;
        }

        .info-value {
            font-family: 'Orbitron', sans-serif;
            font-size: 14px;
            font-weight: 600;
        }

        .bot-message {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 12px;
        }

        .message-label {
            font-size: 9px;
            color: var(--text-secondary);
            letter-spacing: 2px;
            display: block;
            margin-bottom: 5px;
        }

        .bot-message p {
            font-size: 13px;
            color: var(--text-primary);
            line-height: 1.5;
            word-break: break-word;
        }

        .bot-footer {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 15px 20px;
            background: rgba(0, 0, 0, 0.2);
            border-top: 1px solid var(--border);
        }

        .pulse {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            animation: pulseAnim 1.5s ease-in-out infinite;
        }

        @keyframes pulseAnim {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
        }

        .timestamp {
            font-family: 'Orbitron', sans-serif;
            font-size: 11px;
            color: var(--text-secondary);
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            background: var(--bg-card);
            border: 1px dashed var(--border);
            border-radius: 16px;
        }

        .empty-state svg {
            color: var(--text-secondary);
            margin-bottom: 20px;
            opacity: 0.5;
        }

        .empty-state h3 {
            font-family: 'Orbitron', sans-serif;
            font-size: 16px;
            color: var(--text-secondary);
            margin-bottom: 10px;
        }

        .empty-state p {
            color: var(--text-secondary);
            font-size: 14px;
        }

        /* Footer */
        .footer {
            text-align: center;
            padding: 30px;
            color: var(--text-secondary);
            font-size: 12px;
            letter-spacing: 1px;
        }

        .footer span {
            color: var(--primary);
        }

        /* Responsive */
        @media (max-width: 768px) {
            .header-content {
                flex-direction: column;
                gap: 20px;
            }

            .bots-grid {
                grid-template-columns: 1fr;
            }

            .stats-section {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        /* Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
        }

        ::-webkit-scrollbar-track {
            background: var(--bg-dark);
        }

        ::-webkit-scrollbar-thumb {
            background: var(--primary);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: var(--secondary);
        }
    </style>
    <script>
        setTimeout(() => location.reload(), 30000);
    </script>
</head>
<body>
    <div class="bg-animation"></div>
    <div class="grid-overlay"></div>

    <header class="header">
        <div class="header-content">
            <div class="logo">
                <div class="logo-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="10" rx="2"/>
                        <circle cx="12" cy="5" r="3"/>
                        <path d="M12 8v3"/>
                        <path d="M8 15h8"/>
                        <path d="M8 18h5"/>
                    </svg>
                </div>
                <div class="logo-text">
                    <h1>BOT NEXUS</h1>
                    <span>Central Command System</span>
                </div>
            </div>
            <div class="header-actions">
                <div class="status-indicator">SYSTEM ONLINE</div>
                <button class="refresh-btn" onclick="location.reload()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12a9 9 0 11-9-9"/>
                        <path d="M21 3v9h-9"/>
                    </svg>
                    REFRESH
                </button>
            </div>
        </div>
    </header>

    <main class="main">
        <div class="stats-section">
            <div class="stat-card">
                <div class="stat-label">TOTAL BOTS</div>
                <div class="stat-value">${bots.length}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">ACTIVE</div>
                <div class="stat-value">${activeCount}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">SUCCESS</div>
                <div class="stat-value">${successCount}</div>
            </div>
            <div class="stat-card danger">
                <div class="stat-label">ERRORS</div>
                <div class="stat-value">${errorCount}</div>
            </div>
        </div>

        <div class="section-header">
            <h2 class="section-title">DETECTED <span>BOTS</span></h2>
        </div>

        <div class="bots-grid">
            ${botCards || `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M8 15h8"/>
                        <path d="M9 9h.01"/>
                        <path d="M15 9h.01"/>
                    </svg>
                    <h3>NO BOTS DETECTED</h3>
                    <p>Add a bot.py file to any folder in /opt/dev/projects/</p>
                </div>
            `}
        </div>
    </main>

    <footer class="footer">
        AUTO-REFRESH: 30s | POWERED BY <span>HERMES AI</span> | ${new Date().getFullYear()}
    </footer>
</body>
</html>`;
}

// Routes
app.get('/', (req, res) => {
    const bots = getAllBots();
    res.send(getFuturisticHTML(bots));
});

app.get('/api/bots', (req, res) => {
    res.json(getAllBots());
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║        BOT NEXUS - CENTRAL COMMAND       ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log('║  Status: ONLINE                          ║');
    console.log('║  Port: 5001                               ║');
    console.log('║  Dashboard: http://192.168.10.8:5001      ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
});
