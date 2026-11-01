
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
- **File Handling:** Custom FileController (kwa ajili ya ku-view Proof)

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
├── router.php            # Router kwa ajili ya PHP Built-in Server
└── README.md             # Maelekezo (Faili hili)
```

## Workflow ya kazi

- Admin anatengeneza kazi kupitia **Staff Privileges → Task Assignments**, akichagua mteja, aina/mamlaka ya kazi, mzunguko, tarehe ya mwisho na mfanyakazi.
- Kazi zinazoendelea kurudiwa hutumia mzunguko uliochaguliwa; kazi za mara moja hutumia due date iliyowekwa.
- Staff huona kazi zake kwenye **Dashboard** na **My Work**, na hukamilisha kazi kupitia My Work pekee.
- Ruhusa za mfumo zinadhibitiwa na admin kwenye **Staff Privileges → Access Privileges**. Katika **My Work**, staff huona vitendo vinavyolingana na ruhusa alizopewa, kama kuona au kuhariri taarifa za mteja, kufungua nywila, kupakia nyaraka, kuongeza/kufuta mteja, au kumpangia staff mwingine kazi.
- Vitendo vya kuongeza/kufuta wateja, kupakia nyaraka na kugawa kazi vinathibitishwa tena na backend dhidi ya ruhusa za mtumiaji; kugawa kazi kunaruhusiwa kwa wateja waliopangiwa ruhusa hiyo pekee.
- Admin Deadlines/Obligations haionekani tena kama ukurasa tofauti; task assignments zinatumia data na uzalishaji wa closing uliopo.

---

## ⚙️ Jinsi ya Kuweka Mfumo (Installation)

### 1. Mahitaji (Prerequisites)
Hakikisha una vitu hivi kwenye kompyuta yako:
- **XAMPP** (au PHP 8.2+)
- **PostgreSQL** (Imewekwa na inafanya kazi kwenye port `5432`)
- **Composer** (Kwa ajili ya PHP packages)
- **Node.js & npm** (Kwa ajili ya React)

### 2. Kuweka Backend (PHP)
1. Fungua terminal, ingia kwenye folda kuu:
   ```bash
   cd C:\xampp\htdocs\deadline-tracker
   ```
2. Install PHP Packages:
   ```bash
   composer install
   ```
3. Tengeneza faili la `.env` kwa kunakili mfano:
   *(Weka password zako za PostgreSQL, Gmail, na WhatsApp API hapa)*
4. Tengeneza Database na u-import Schema:
   ```bash
   psql -U postgres -c "CREATE DATABASE deadline_tracker;"
   psql -U postgres -d deadline_tracker -f database/schema.sql
   ```
   *(Tumia database `deadline_tracker` iliyopo; usiunde database nyingine. `database/schema.sql` ndiyo schema kuu ya mfumo na sasa ina fields za Client Compliance Profile. Kwa database iliyokwisha tengenezwa, ongeza fields hizo kwenye database hiyohiyo kwa amri hii; kubadilisha schema file peke yake haku-update database iliyopo.)*
   ```bash
   psql -U postgres -d deadline_tracker -c "ALTER TABLE public.closings ADD COLUMN IF NOT EXISTS authorities jsonb DEFAULT '[]'::jsonb NOT NULL;"
   psql -U postgres -d deadline_tracker -c "ALTER TABLE public.reminder_logs DROP CONSTRAINT IF EXISTS reminder_logs_channel_check; ALTER TABLE public.reminder_logs ADD CONSTRAINT reminder_logs_channel_check CHECK (channel IN ('whatsapp', 'email', 'sms'));"
   psql -U postgres -d deadline_tracker -c "ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company_registration_number varchar(100), ADD COLUMN IF NOT EXISTS business_type varchar(40), ADD COLUMN IF NOT EXISTS enabled_tax_types jsonb NOT NULL DEFAULT '[]'::jsonb, ADD COLUMN IF NOT EXISTS financial_year_end date;"
   psql -U postgres -d deadline_tracker -c "ALTER TABLE public.examinations ADD COLUMN IF NOT EXISTS fee_amount numeric(14,2) NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS fee_paid boolean NOT NULL DEFAULT false; ALTER TABLE public.examinations ALTER COLUMN attachment_path DROP NOT NULL;"
   psql -U postgres -d deadline_tracker -c "ALTER TABLE public.closings ADD COLUMN IF NOT EXISTS completion_notes text; ALTER TABLE public.obligations DROP CONSTRAINT IF EXISTS obligations_authority_check; ALTER TABLE public.obligations ADD CONSTRAINT obligations_authority_check CHECK (authority IN ('TRA', 'ZRA', 'BPRA', 'ZSSF', 'ALL', 'TWO'));"
   psql -U postgres -d deadline_tracker -c "ALTER TABLE public.client_documents ADD COLUMN IF NOT EXISTS uploader_name varchar(255); UPDATE public.client_documents d SET uploader_name = u.name FROM public.users u WHERE d.uploaded_by = u.id AND d.uploader_name IS NULL; ALTER TABLE public.client_documents ALTER COLUMN uploader_name SET NOT NULL; ALTER TABLE public.client_documents DROP CONSTRAINT IF EXISTS client_documents_uploaded_by_fkey; ALTER TABLE public.client_documents ALTER COLUMN uploaded_by DROP NOT NULL; ALTER TABLE public.client_documents ADD CONSTRAINT client_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;"
   psql -U postgres -d deadline_tracker -f C:\xampp\htdocs\deadline-tracker\database\migrations\20261031_create_examinations.sql
   psql -U postgres -d deadline_tracker -f C:\xampp\htdocs\deadline-tracker\database\migrations\20261101_create_client_documents.sql
   psql -U postgres -d deadline_tracker -f C:\xampp\htdocs\deadline-tracker\database\auditor_messages.sql
   ```
   *(Thibitisha kuwa API inatumia database yenye jedwali hilo: `psql -U postgres -d deadline_tracker -c "SELECT current_database(), to_regclass('public.auditor_messages');"` inapaswa kurudisha `deadline_tracker` na `auditor_messages`.)*
5. Washa Backend Server **kwa kutumia `router.php`**:
   ```bash
   php -S 127.0.0.1:8000 router.php
   ```
   *(Kumbuka: Tumia `router.php` badala ya `-t public` ili `FileController` ifanye kazi vizuri).*

### 3. Kuweka Frontend (React)
1. Fungua terminal mpya, ingia kwenye folda ya frontend:
   ```bash
   cd frontend
   ```
2. Install Node Packages:
   ```bash
   npm install
   ```
3. Washa Frontend Server:
   ```bash
   npm run dev
   ```
   *(Mfumo utafunguka kwenye `http://localhost:5173` au `5174`)*

---

## 🔐 Aina za Watumiaji (User Roles)

### 1. Admin (Msimamizi)
- Anasimamia wafanyakazi wote (Staff).
- Anaongeza, kuhariri, na kufuta Wateja (Clients).
- Anaweka Mikataba (Obligations) na kuwapa Staff.
- **Anaweza kufunga kazi mwenyewe** (Mark as Closed) na kuweka Proof.
- Anaona ripoti za utendaji (Staff Performance) na Malipo.
- Anaweza kubadilisha mipangilio ya mfumo (SMTP, WhatsApp).
- Anaweza ku-view Proof (Attachment) za Staff.

### 2. Staff (Mfanyakazi)
- Ana dashboard yenye kalenda, kazi alizokabidhiwa na ruhusa alizopewa.
- Anaweza kufunga kazi kwa kuweka Reference Number na maelezo ya matokeo; uthibitisho hupakiwa pale obligation inapouhitaji.
- Anaweza ku-view Proof alizopakia.
- Anaweza kubadilisha Profile yake na Password.

---

## 🕒 Cron Job (Kazi za Kiotomatiki)
Mfumo unatumia Cron Job kutengeneza kazi (Closings) kila siku na kutuma taarifa (Reminders) kwa Staff.
Ili kuiendesha kwa mkono (Manual):
```bash
php cron/daily_reminders.php
```

*(Kwenye server halisi, hii inawekwa kwenye Crontab ijiendeshe yenyewe kila siku saa 08:00 asubuhi).*

---

## 🔑 Taarifa za Kuingia (Default Login)
- **Email:** `admin@sbc.local`
- **Password:** `hussein2334`

*(Tafadhali badilisha password hii mara baada ya kuingia kwenye mfumo kwa mara ya kwanza).*

---

## 🛡️ Usalama (Security)
- **JWT Token:** Kila mtumiaji anapoingia, anatengenezewa token ya usalama.
- **Idle Timeout:** Mtumiaji anarudishwa kwenye login kama hajagusa kitu kwa dakika 5.
- **Role-Based Access:** Staff hawezi kufikia API za Admin.
- **Password Hashing:** Password zote zimefichwa kwa `bcrypt`.
- **File Security:** Faili zinatolewa tu kwa watumiaji waliologin (Admin na Staff).

---

## 📞 Mawasiliano
Kwa msaada wowote, tafadhali wasiliana na timu ya **HIMMA Technologies** au Msimamizi wa **SBC**.
