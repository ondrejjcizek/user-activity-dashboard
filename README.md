# Procorp Frontend Test – Admin Dashboard

A modern admin dashboard built with **SvelteKit (Svelte 5)** for managing users and analyzing login activity. The project includes OAuth authentication, a custom UI system, role-based access, and real login analytics powered by Turso and Drizzle ORM.

---

### 🧪 Live Demo

- 🌐 Production: [dashboard.ondrejcizek.cz](https://dashboard.ondrejcizek.cz)
- 📦 Repository: [github.com/ondrejjcizek/procorp-frontend-test](https://github.com/ondrejjcizek/procorp-frontend-test)

---

## 🧰 Tech Stack

- **Framework:** SvelteKit (Svelte 5)
- **Styling:** Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/) + OverlayScrollbars + Lenis
- **Charts:** Chart.js (+ Zoom plugin)
- **Authentication:** [BetterAuth](https://github.com/huntabyte/better-auth) (GitHub, Google, Email/Password)
- **ORM:** Drizzle ORM
- **Database:** Turso (libSQL)
- **Email:** Resend API (custom email verification)
- **Routing:** Shallow routing with Drawer (on `/users/[id]`)
- **Deployment:** Vercel

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/ondrejjcizek/procorp-frontend-test.git
cd procorp-frontend-test

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Push the schema to the database (required before first run)
pnpm db:push

# (Optional) Seed the database with test data
pnpm db:seed

# Start the development server
pnpm dev
```

## 🧩 Features

### 🧑‍💼 Admin Area

- ✅ Sign in via **GitHub**, **Google**, or **email/password** using **BetterAuth**
- ✅ Email verification with custom Resend template
- ✅ Auto role promotion for whitelisted admin emails
- ✅ Login history auto-generated on first login
- ✅ Device, browser, and IP tracking on every login
- ✅ Online/offline state synced on login/logout
- ✅ Cookie-based sessions with expiration and cache

---

### 👥 Users

- 🧪 Stored in **Turso DB**, seedable via `pnpm db:seed`
- 🔍 Fuzzy search by name/email using **Fuse.js**
- 📊 Sorted by online status and last active time
- 🧾 User detail shown in Drawer (shallow routing)
- ⚠️ Suspicious users flagged with warnings
- 🟢 Animated online/offline indicators
- 📅 Joined date, role badge, and status shown
- 🛠️ User actions: **View** and **Delete**

---

### 👤 Account

- 📇 Displays avatar, name, email, and role
- 📬 Email verification via **Resend**
- 📊 Activity summary:
  - Joined date
  - Last active timestamp
  - Logins in last 30 and 3 days
- 📈 Login frequency chart (last 30 days, Chart.js)
- ⚠️ Suspicious days highlighted (≥ 8 logins)
- 🧭 Admins can navigate to full user list
- 🔒 Secure logout with session clear

---

### 📈 Analytics

- 📊 Daily login trend (30 days) visualized with **Chart.js**
- 📉 Spike detection based on activity thresholds
- 🔄 Auto-refresh login data every 30 seconds
- 🖱️ Pan + zoom interactions via Chart.js plugin

---

### 🚨 Suspicious Activity Detection

- Users are flagged if:
  - Logged in **10×+ per day** on **3 or more days**
  - Had a **sudden spike** (e.g. avg. 2–3 → 15+)
- ⚠️ Suspicious users are listed and clearly marked

---

### 🌐 API Routes

- `GET /api/users`

  - Returns all users from Turso DB
  - Includes login history, activity stats, and role
  - Suspicious login detection
  - 🛡️ **Admin-only access**

- `GET /api/activity/[id]`
  - Returns login history for a specific user
  - Logins in last 30 / 3 days
  - Last active timestamp
  - 🛡️ **Admin-only access**
