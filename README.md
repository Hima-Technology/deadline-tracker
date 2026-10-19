# SBC Deadline Tracker

**SBC Deadline Tracker** ni mfumo kamili wa usimamizi wa kazi (Task Management System) ulioundwa mahsusi kwa ajili ya **Shariya Business Consultancy (SBC)**. Mfumo huu unasaidia ofisi kufuatilia tarehe za mwisho (Deadlines) za wateja, kusimamia malipo, mikopo, na kuhakikisha hakuna kazi inayochelewa.

Mfumo umejengwa kwa **Backend (PHP)** na **Frontend (React)**, ukiwa na mwonekano wa kisasa (Clean White Theme) unaofaa kwa matumizi ya ofisini, simu, na kompyuta.

---

## 🚀 Teknolojia Zilizotumika

### Backend (API)
- **Lugha:** PHP 8.2+
- **Database:** PostgreSQL
- **Architecture:** Custom MVC (Model-View-Controller) bila Framework
- **Authentication:** JWT (JSON Web Tokens)
- **Email:** PHPMailer (SMTP)
- **Messaging:** WhatsApp Business Cloud API

### Frontend (UI)
- **Lugha:** React (TypeScript)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **Alerts:** SweetAlert2

---

## 📂 Muundo wa Folda (Project Structure)

```text
deadline-tracker/
├── app/                  # Core ya Backend (Controllers, Models, Services)
├── config/               # Mipangilio ya mfumo (config.php)
├── cron/                 # Kazi za nyuma (Daily Reminders)
├── database/             # Faili la schema.sql (Database Export)
├── frontend/             # Mfumo wa React (UI)
├── public/               # Mahali pa kuanzia (index.php, .htaccess)
├── storage/              # Mahali pa kuhifadhi faili (uploads, logs)
├── vendor/               # PHP Packages (composer)
├── .env                  # Siri na Mipangilio (Haipaswi kuwekwa kwenye Git)
├── composer.json         # PHP Dependencies
└── README.md             # Maelekezo (Faili hili)
⚙️ Jinsi ya Kuweka Mfumo (Installation)
1. Mahitaji (Prerequisites)
Hakikisha una vitu hivi kwenye kompyuta yako:

XAMPP (au PHP 8.2+)

PostgreSQL (Imewekwa na inafanya kazi kwenye port 5432)

Composer (Kwa ajili ya PHP packages)

Node.js & npm (Kwa ajili ya React)

2. Kuweka Backend (PHP)
Fungua terminal, ingia kwenye folda kuu:

bash
cd C:\xampp\htdocs\deadline-tracker
Install PHP Packages:

bash
composer install
Tengeneza faili la .env kwa kunakili mfano:
(Weka password zako za PostgreSQL, Gmail, na WhatsApp API hapa)

Tengeneza Database na u-import Schema:

bash
psql -U postgres -c "CREATE DATABASE deadline_tracker;"
psql -U postgres -d deadline_tracker -f database/schema.sql
Washa Backend Server:

bash
php -S 127.0.0.1:8000 -t public
3. Kuweka Frontend (React)
Fungua terminal mpya, ingia kwenye folda ya frontend:

bash
cd frontend
Install Node Packages:

bash
npm install
Washa Frontend Server:

bash
npm run dev
(Mfumo utafunguka kwenye http://localhost:5173 au 5174)

🔐 Aina za Watumiaji (User Roles)
1. Admin (Msimamizi)
Anasimamia wafanyakazi wote (Staff).

Anaongeza, kuhariri, na kufuta Wateja (Clients).

Anaweka Mikataba (Obligations) na kuwapa Staff.

Anaona ripoti za utendaji (Staff Performance) na Malipo.

Anaweza kubadilisha mipangilio ya mfumo (SMTP, WhatsApp).

2. Staff (Mfanyakazi)
Anaona kazi zake tu (My Closings).

Anaweza kufunga kazi (Mark as Closed) kwa kuweka Reference Number na Kupakia Uthibitisho (Proof).

Anaweza kubadilisha Profile yake na Password.

🕒 Cron Job (Kazi za Kiotomatiki)
Mfumo unatumia Cron Job kutengeneza kazi (Closings) kila siku na kutuma taarifa (Reminders) kwa Staff.
Ili kuiendesha kwa mkono (Manual):

bash
php cron/daily_reminders.php
(Kwenye server halisi, hii inawekwa kwenye Crontab ijiendeshe yenyewe kila siku saa 08:00 asubuhi).

🔑 Taarifa za Kuingia (Default Login)
Email: admin@sbc.local

Password: hussein2334

(Tafadhali badilisha password hii mara baada ya kuingia kwenye mfumo kwa mara ya kwanza).

🛡️ Usalama (Security)
JWT Token: Kila mtumiaji anapoingia, anatengenezewa token ya usalama.

Idle Timeout: Mtumiaji anarudishwa kwenye login kama hajagusa kitu kwa dakika 5.

Role-Based Access: Staff hawezi kufikia API za Admin.

Password Hashing: Password zote zimefichwa kwa bcrypt.

📞 Mawasiliano
Kwa msaada wowote, tafadhali wasiliana na timu ya HIMMA Technologies au Msimamizi wa SBC.

