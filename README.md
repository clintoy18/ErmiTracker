# ErmiTracker

Mobile-friendly React + Supabase application for tracking emergency donations and aid distributions across multiple organizations, with role-based access, donation approval, and a public transparency page.

## Stack

- React + Vite
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Realtime

## File Structure

```text
.
|-- .env.example
|-- index.html
|-- package.json
|-- postcss.config.js
|-- supabase-schema.sql
|-- tailwind.config.js
|-- vite.config.js
`-- src
    |-- App.jsx
    |-- index.css
    |-- main.jsx
    |-- supabase.js
    |-- components
    |   |-- AppShell.jsx
    |   |-- DataTable.jsx
    |   |-- DistributionForm.jsx
    |   |-- DonationForm.jsx
    |   |-- FormInput.jsx
    |   |-- FormSelect.jsx
    |   |-- Navbar.jsx
    |   |-- PageHeader.jsx
    |   |-- ProtectedRoute.jsx
    |   |-- SectionCard.jsx
    |   |-- StatBadge.jsx
    |   `-- SummaryCard.jsx
    |-- context
    |   `-- AuthContext.jsx
    |-- hooks
    |   `-- useRealtimeCollection.js
    |-- pages
    |   |-- AddDonation.jsx
    |   |-- AdminDashboard.jsx
    |   |-- Dashboard.jsx
    |   |-- DistributionsList.jsx
    |   |-- DonationsList.jsx
    |   |-- Login.jsx
    |   |-- OrganizationDashboard.jsx
    |   `-- PublicView.jsx
    |-- services
    |   `-- firestore.js
    `-- utils
        |-- formatters.js
        `-- inventory.js
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your Supabase project values.

3. In Supabase:

- Enable Email/Password in Authentication
- Run [supabase-schema.sql](/C:/Users/Juliet/DonationTracker/supabase-schema.sql) in the SQL editor
- The first registered user becomes admin automatically

4. Start the app:

```bash
npm run dev
```

## Production Routing

This app uses client-side routing with React Router. Refresh-safe SPA rewrites are included for common hosts:

- [vercel.json](/C:/Users/Juliet/DonationTracker/vercel.json) for Vercel
- [netlify.toml](/C:/Users/Juliet/DonationTracker/netlify.toml) and [public/_redirects](/C:/Users/Juliet/DonationTracker/public/_redirects) for Netlify

If you deploy on another host, configure all unknown routes to serve `index.html`.

## PostgreSQL Schema

### `public.users`

```sql
id uuid primary key
name text
email text
role user_role -- 'admin' | 'org'
organization_name text
created_at timestamptz
```

### `public.donations`

```sql
id uuid primary key
organization_id uuid
item_name text
quantity numeric
type donation_type -- 'cash' | 'goods'
status record_status -- 'pending' | 'approved'
created_at timestamptz
```

### `public.distributions`

```sql
id uuid primary key
organization_id uuid
item_name text
quantity numeric
location text
status record_status -- 'pending' | 'approved'
created_at timestamptz
```

## Behavior

- Admin users can see all organizations, filter by organization, and approve pending donations and distributions.
- Organization users can register, sign in, create donations and distributions, and only see their own records.
- Public users land on `/` without logging in.
- Public donations show only `approved` donations.
- Public distributions show only `approved` distributions.
- Inventory is computed dynamically from donations minus distributions, both overall and per organization.
- Records without a related organization name default to `"Barangay"` for backward compatibility.

## Realtime

The app uses Supabase Realtime `postgres_changes` subscriptions on:

- `public.users`
- `public.donations`
- `public.distributions`

Any insert/update triggers a refetch so dashboards, lists, and the public page stay current.

## Approval Flow

- The first registered user is promoted to `admin` automatically by the database trigger.
- Organization-created donations are saved with `status = 'pending'`
- Organization-created distributions are saved with `status = 'pending'`
- Admin-created donations and distributions are saved with `status = 'approved'`
- Admins can approve pending donations and distributions from their respective list pages

## Notes

- The current schema uses `organization_id` referencing `public.users.id`. In this implementation, each organization is represented by a `users` row, which matches the schema you specified.
- If you want multiple users per organization later, the right next step is adding a dedicated `organizations` table and pointing both `users.organization_id` and record tables to it.
