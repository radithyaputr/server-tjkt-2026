# Server TJKT 2026 - Production Ready

Proyek ini adalah backend dan infrastruktur berbasis Node.js, Express, dan MySQL/MariaDB untuk sistem manajemen file dengan autentikasi (JWT) yang dirancang sesuai dengan standar kompetensi Teknik Jaringan Komputer dan Telekomunikasi (TJKT).

## Fitur Utama
- **Autentikasi JWT**: Role-based access control (`Admin`, `Guru`, `Siswa`). Token dikirim via HTTPOnly cookie (tahan XSS).
- **File Management**: Upload, download, dan tracking jumlah unduhan. Hanya file aman (PDF, ZIP, DOCX, ISO, gambar) yang diizinkan.
- **Keamanan Berlapis**: Rate Limiting (App + Nginx), Helmet.js (HTTP Headers), Content Security Policy, HSTS.
- **Infrastruktur Nginx**: Reverse proxy, Let's Encrypt SSL config, Strict Security Headers, OCSP Stapling.

## Prasyarat
- Node.js (v18 atau lebih baru)
- Nginx (untuk deployment server)
- PM2 (untuk produksi: `npm install -g pm2`)

## Instalasi (Local Development)

1. Clone repositori.
2. Install dependensi:
   ```bash
   npm install
   ```
3. Buat database MySQL/MariaDB:
   ```bash
   mysql -u root -p -e "CREATE DATABASE server_tjkt;"
   ```

4. Konfigurasi environment:
   ```bash
   cp .env.example .env
   nano .env  # Isi DB_USER, DB_PASSWORD sesuai server MySQL/MariaDB kamu
   ```
   Generate `JWT_SECRET` dengan string acak:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

5. Buat Akun Admin Pertama:
   ```bash
   node seed.js
   ```
   > **IMPORTANT**: Segera ganti password `admin123` setelah login pertama.
5. Jalankan development server:
   ```bash
   npm run dev
   ```

## API Endpoints

Semua endpoint berada di bawah path `/api`:

| Method | Path | Auth | Role | Deskripsi |
|--------|------|------|------|-----------|
| POST | `/api/auth/register` | No | - | Daftar user baru |
| POST | `/api/auth/login` | No | - | Login (mendapatkan HTTPOnly cookie) |
| POST | `/api/auth/logout` | Yes | Any | Logout (menghapus cookie) |
| GET | `/api/auth/me` | Yes | Any | Cek status login saat ini |
| GET | `/api/files` | Yes | Any | Daftar semua file |
| GET | `/api/files/download/:id` | Yes | Any | Download file berdasarkan ID |
| POST | `/api/files/upload` | Yes | Admin/Guru | Upload file (200MB max, tipe tertentu) |
| DELETE | `/api/files/:id` | Yes | Admin/Guru | Hapus file |

## Deployment Server TJKT (Manual — Ubuntu/Debian/Arch)

### 1. Setup Aplikasi

```bash
# Clone proyek
git clone https://github.com/radithyaputr/server-tjkt-2026.git /var/www/server-tjkt
cd /var/www/server-tjkt

# Install dependencies
npm install --production

# Setup environment
cp .env.example .env
nano .env  # Isi JWT_SECRET dengan string acak

# Seed admin user
node seed.js
```

### 2. Setup SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tjkt.example.com
```

### 3. Konfigurasi Nginx

```bash
sudo cp nginx/default.conf /etc/nginx/sites-available/tjkt
sudo nano /etc/nginx/sites-available/tjkt  # Ganti tjkt.example.com dengan domain
sudo ln -s /etc/nginx/sites-available/tjkt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Jalankan Backend dengan PM2

```bash
# Production
NODE_ENV=production pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Monitor
pm2 status
pm2 logs server-tjkt-2026
pm2 monit
```

### 5. Firewall

```bash
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp       # HTTP (redirect to HTTPS)
sudo ufw allow 443/tcp      # HTTPS
sudo ufw deny 3000/tcp      # Block direct Node.js access
sudo ufw enable
```

## Deployment dengan Docker (Arch Linux / Any Linux)

Cara paling cepat dan terisolasi. Cukup dengan Docker Compose.

### Prasyarat (di server)
```bash
# Arch
sudo pacman -S docker docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER  # logout/login setelah ini

# Ubuntu/Debian
sudo apt install docker.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

### Step Deploy

```bash
# 1. Clone atau transfer project ke server
git clone https://github.com/radithyaputr/server-tjkt-2026.git
cd server-tjkt-2026

# 2. Setup environment
cp .env.example .env
nano .env
# Isi DB_PASSWORD, DB_ROOT_PASSWORD
# Generate JWT_SECRET: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 3. Build & jalankan semua container
docker compose up -d --build

# 4. Cek status
docker compose ps

# 5. Seed admin user
docker compose exec app node seed.js

# 6. Test API
curl http://localhost/api/health
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Akses via browser: `http://<ip-server>`

### Setup SSL (kalo sudah punya domain)

```bash
# Install certbot
sudo pacman -S certbot    # Arch
# sudo apt install certbot # Ubuntu

# Stop Nginx container biar port 80 bebas
docker compose stop web

# Dapatkan sertifikat
sudo certbot certonly --standalone -d domain-anda.com

# Copy ke folder project
sudo cp /etc/letsencrypt/live/domain-anda.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/domain-anda.com/privkey.pem nginx/ssl/

# Uncomment HTTPS block di nginx/default.conf, ganti server_name
nano nginx/default.conf

# Start ulang
docker compose up -d web
```

### Perintah Berguna

| Perintah | Fungsi |
|----------|--------|
| `docker compose logs -f app` | Lihat log realtime |
| `docker compose restart app` | Restart app container |
| `docker compose exec app node seed.js` | Seed admin di dalam container |
| `docker compose down` | Stop & hapus semua container |
| `docker compose up -d --build` | Rebuild & start |
| `docker system prune` | Bersihin container/image ga kepake |

## Struktur Proyek

```
server-tjkt-2026/
├── Dockerfile             # Production container image
├── docker-compose.yml     # Orkestrasi container (app + db + web)
├── .dockerignore          # File yang di-skip waktu build Docker
├── ecosystem.config.js    # PM2 config (opsional)
├── nginx/
│   ├── default.conf       # Nginx reverse proxy config (Docker)
│   ├── ssl/               # Let's Encrypt certificates (diisi di server)
│   └── logs/              # Nginx logs
├── src/
│   ├── index.js           # Entry point
│   ├── config/
│   │   └── database.js    # Database connection
│   ├── controllers/
│   │   ├── authController.js
│   │   └── fileController.js
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   └── uploadMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   └── File.js
│   ├── public/
│   │   └── index.html     # Frontend SPA
│   └── routes/
│       └── api.js
├── uploads/               # Private file storage (Docker volume)
├── .env.example
├── seed.js
└── package.json
```

## Checklist Keamanan
- [ ] JWT_SECRET diganti dengan string acak (64+ karakter hex)
- [ ] Password default admin (`admin123`) telah diubah
- [ ] HTTPS aktif dengan sertifikat Let's Encrypt
- [ ] Port Node.js (3000) tidak terbuka ke publik (hanya via Nginx/Docker)
- [ ] File `.env` tidak masuk ke repository (terdaftar di `.gitignore`)
- [ ] Semua container berjalan: `docker compose ps`
- [ ] Log monitoring aktif: `docker compose logs -f`
- [ ] Backup database rutin: `docker compose exec db mariadb-dump -u root -p server_tjkt > backup.sql`
- [ ] Auto-restart: `restart: unless-stopped` sudah di docker-compose.yml

## Troubleshooting

**Nginx error: SSL certificate not found**
Jalankan `sudo certbot --nginx -d domain-anda.com` untuk mendapatkan sertifikat.

**ECONNREFUSED / SequelizeConnectionRefusedError**
Pastikan MySQL/MariaDB sedang berjalan: `sudo systemctl start mariadb` atau `sudo systemctl start mysql`.

**ER_BAD_DB_ERROR / Unknown database 'server_tjkt'**
Buat database: `mysql -u root -p -e "CREATE DATABASE server_tjkt;"`

**Cannot POST /api/auth/login (413 Request Entity Too Large)**
Pastikan `client_max_body_size` di Nginx sudah diset (lihat `nginx/default.conf`).

**Upload file gagal dengan error "File type not allowed"**
Periksa ekstensi file. Hanya: PDF, ZIP, RAR, DOC/DOCX, XLS/XLSX, PPT/PPTX, JPG, PNG, GIF, WebP, dan ISO yang diizinkan.

## Lisensi
ISC
