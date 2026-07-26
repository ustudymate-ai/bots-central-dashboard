#!/usr/bin/env python3
"""
Central Dashboard for Bot Monitoring
Scans /opt/dev/projects/ for bot projects and displays their status.
A bot project is defined as a directory containing a 'bot.py' file.
"""

import os
import json
import time
from pathlib import Path
from datetime import datetime
from flask import Flask, render_template_string, jsonify

app = Flask(__name__)

# Configuration
BASE_PATH = Path("/opt/dev/projects")
EXCLUDE_DIRS = {".git", "__pycache__", "node_modules", "venv"}

def is_bot_directory(dirpath):
    """Check if a directory is a bot project (contains bot.py)"""
    bot_file = dirpath / "bot.py"
    return bot_file.is_file()

def get_bot_status(bot_dir):
    """Extract status information from a bot directory"""
    bot_name = bot_dir.name
    status = {
        "name": bot_name,
        "last_run": None,
        "last_run_ago": None,
        "status": "unknown",
        "message": "No logs found",
        "log_path": None,
    }
    
    # Look for logs directory
    logs_dir = bot_dir / "logs"
    if logs_dir.is_dir():
        log_files = list(logs_dir.glob("*.log"))
        if not log_files:
            log_files = [f for f in logs_dir.iterdir() if f.is_file()]
        
        if log_files:
            latest_log = max(log_files, key=lambda f: f.stat().st_mtime)
            status["log_path"] = str(latest_log)
            
            mtime = latest_log.stat().st_mtime
            status["last_run"] = datetime.fromtimestamp(mtime).isoformat()
            seconds_ago = time.time() - mtime
            
            if seconds_ago < 60:
                status["last_run_ago"] = f"{int(seconds_ago)} detik lalu"
            elif seconds_ago < 3600:
                status["last_run_ago"] = f"{int(seconds_ago//60)} menit lalu"
            elif seconds_ago < 86400:
                status["last_run_ago"] = f"{int(seconds_ago//3600)} jam lalu"
            else:
                status["last_run_ago"] = f"{int(seconds_ago//86400)} hari lalu"
            
            try:
                with open(latest_log, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    if lines:
                        last_line = lines[-1].strip()
                        status["message"] = last_line[:200]
                        
                        if any(word in last_line.lower() for word in ['berhasil', 'success', 'sukses']):
                            status["status"] = "success"
                        elif any(word in last_line.lower() for word in ['gagal', 'failed', 'error', 'fail']):
                            status["status"] = "error"
                        else:
                            status["status"] = "info"
            except Exception:
                status["message"] = "Error membaca log"
    
    # Fallback: check bot.py modification time
    if status["last_run"] is None:
        bot_py = bot_dir / "bot.py"
        if bot_py.is_file():
            mtime = bot_py.stat().st_mtime
            status["last_run"] = datetime.fromtimestamp(mtime).isoformat()
            seconds_ago = time.time() - mtime
            if seconds_ago < 60:
                status["last_run_ago"] = f"{int(seconds_ago)} detik lalu"
            elif seconds_ago < 3600:
                status["last_run_ago"] = f"{int(seconds_ago//60)} menit lalu"
            elif seconds_ago < 86400:
                status["last_run_ago"] = f"{int(seconds_ago//3600)} jam lalu"
            else:
                status["last_run_ago"] = f"{int(seconds_ago//86400)} hari lalu"
            status["message"] = "Bot file modified (no logs)"
            status["status"] = "idle"
    
    return status

@app.route('/')
def index():
    bots = []
    if BASE_PATH.exists():
        for item in BASE_PATH.iterdir():
            if item.is_dir() and item.name not in EXCLUDE_DIRS:
                if is_bot_directory(item):
                    bots.append(get_bot_status(item))
    
    bots.sort(key=lambda x: x["name"])
    
    return render_template_string('''
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Dashboard Bot Pusat</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #3498db; color: white; }
        tr:hover { background-color: #f5f5f5; }
        .status-success { color: #27ae60; font-weight: bold; }
        .status-error { color: #e74c3c; font-weight: bold; }
        .status-info { color: #f39c12; font-weight: bold; }
        .status-idle { color: #9b59b6; font-weight: bold; }
        .status-unknown { color: #95a5a6; font-weight: bold; }
        .refresh-btn { background-color: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 10px 0; }
        .refresh-btn:hover { background-color: #2c80b9; }
        .last-updated { text-align: right; color: #7f8c8d; font-size: 0.9em; margin-top: 10px; }
    </style>
    <script>
        function refreshPage() { location.reload(); }
        setInterval(refreshPage, 30000);
    </script>
</head>
<body>
    <div class="container">
        <h1>Dashboard Bot Pusat</h1>
        <p class="last-updated">Diperbarui setiap 30 detik | <button class="refresh-btn" onclick="refreshPage()">Segarkan</button></p>
        <table>
            <thead><tr><th>Nama Bot</th><th>Terakhir Jalankan</th><th>Status</th><th>Pesan</th></tr></thead>
            <tbody>
                {% for bot in bots %}
                <tr>
                    <td><strong>{{ bot.name }}</strong></td>
                    <td>{{ bot.last_run_ago or 'Belum pernah' }}</td>
                    <td class="status-{{ bot.status }}">{{ bot.status|capitalize }}</td>
                    <td>{{ bot.message }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
        <p class="last-updated">Total bot terdeteksi: {{ bots|length }}</p>
    </div>
</body>
</html>
''', bots=bots)

@app.route('/api/bots')
def api_bots():
    bots = []
    if BASE_PATH.exists():
        for item in BASE_PATH.iterdir():
            if item.is_dir() and item.name not in EXCLUDE_DIRS:
                if is_bot_directory(item):
                    bots.append(get_bot_status(item))
    bots.sort(key=lambda x: x["name"])
    return jsonify(bots)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
