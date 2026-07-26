# Bots Central Dashboard

Dashboard terpusat untuk memantau semua bot automation projects.

## ✨ Fitur

- 🤖 Memindai dan mendeteksi semua bot di `/opt/dev/projects/`
- 📊 Menampilkan status setiap bot (terakhir run, pesan, status)
- 🔄 Auto-refresh setiap 30 detik
- 📱 Interface web yang responsif
- 🚀 Zero-configuration - cukup letakkan bot.py di folder manapun

## 📋 Requirements

- Python 3.7+
- Flask

## 🚀 Instalasi

### 1. Install dependencies

```bash
pip3 install flask --break-system-packages
```

### 2. Jalankan dashboard

```bash
python3 dashboard.py
```

Dashboard akan berjalan di `http://localhost:5001`

## 📁 Cara Kerja

Dashboard memindai direktori `/opt/dev/projects/` dan mencari folder yang mengandung file `bot.py`. Untuk setiap bot yang terdeteksi:

1. Membaca log terbaru dari folder `logs/`
2. Menganalisis status berdasarkan pesan terakhir
3. Menampilkan waktu terakhir run

### Struktur Bot yang Dikenali

```
/opt/dev/projects/
├── bot-1/
│   ├── bot.py           ← File yang dicari
│   ├── .env.example
│   ├── logs/
│   │   └── claim.log    ← Log dibaca dari sini
│   └── ...
├── bot-2/
│   ├── bot.py
│   ├── logs/
│   │   └── claim.log
│   └── ...
└── bots-central-dashboard/
    ├── dashboard.py     ← Dashboard ini
    └── ...
```

## 🎨 Status Indicators

| Status | Warna | Arti |
|--------|-------|------|
| success | Hijau | Bot berhasil menjalankan task |
| error | Merah | Ada error atau failure |
| info | Orange | Informasi umum |
| idle | Ungu | Bot belum pernah run |
| unknown | Abu-abu | Status tidak diketahui |

## 🔧 API Endpoints

### GET `/`
Menampilkan dashboard HTML

### GET `/api/bots`
Mengembalikan JSON dengan status semua bot:
```json
[
  {
    "name": "ninja-income-bot",
    "last_run": "2026-07-26T11:46:01",
    "last_run_ago": "30 menit lalu",
    "status": "success",
    "message": "Berhasil mengklaim hadiah!"
  }
]
```

## 🌐 Konfigurasi

Edit `dashboard.py` untuk mengubah:
- `BASE_PATH` - direktori scan (default: `/opt/dev/projects`)
- `EXCLUDE_DIRS` - folder yang diabaikan
- Port (default: 5001)

## 📝 Catatan

- Dashboard otomatis refresh setiap 30 detik
- Dapat diakses dari mana saja di jaringan (0.0.0.0:5001)
- Tidak memerlukan konfigurasi khusus untuk setiap bot
- Kompatibel dengan bot yang menggunakan struktur logs folder

## 📄 License

MIT - Gunakan untuk keperluan pribadi
