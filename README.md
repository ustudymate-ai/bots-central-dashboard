# Bots Central Dashboard

Dashboard web terpusat untuk memantau semua bot automation projects di `/opt/dev/projects/`.

## ✨ Fitur

- 🤖 Otomatis mendeteksi bot baru (folder yang punya `bot.py`)
- 📊 Status tiap bot (berhasil/error/last run)
- 🔄 Auto-refresh setiap 30 detik
- 📦 API JSON endpoint untuk integrasi
- ⚡ Ringan — Express.js

## Tech Stack

- **Node.js** (v22+)
- **Express.js**
- **Zero dependencies** selain Express

## Cara Pakai

```bash
npm install
npm start
```

Akses: **http://localhost:5001** atau **http://<ip-server>:5001**

## API

### `GET /` — Halaman dashboard HTML

### `GET /api/bots` — JSON status semua bot

```json
[
  {
    "name": "ninja-income-bot",
    "lastRun": "2026-07-26T11:52:36.116Z",
    "lastRunAgo": "38 menit lalu",
    "status": "success",
    "message": "Berhasil mengklaim hadiah."
  }
]
```

## Struktur

```
bots-central-dashboard/
├── server.js        # main app
├── package.json
├── .gitignore
└── README.md
```

Bot akan otomatis terdeteksi selama berada di `/opt/dev/projects/` dengan file `bot.py`.

## Author

Dibuat dengan bantuan Hermes AI Agent.
