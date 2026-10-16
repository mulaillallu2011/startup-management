# Startup Management

A work-in-progress management application for robotics kits, electronics, workshops, students, and classes. Built with Next.js, React, TypeScript, Tailwind CSS, and Supabase.

[Browse source](https://github.com/mulaillallu2011/startup-management) · [Mulail's portfolio](https://mulaillallu2011.github.io/mulail-portfolio/)

## Features in the supplied source

- Dashboard summaries, activity, stock alerts, and reports
- Products, inventory adjustments, suppliers, and purchases
- Sales, billing, and student payments
- Students, courses, batches, and enrolment
- Supabase sign-in, admin profile checks, user management, and company settings

These screens are implemented in the source. Their authenticated workflows have not yet been verified against a configured database. This repository is not a claim of production readiness.

## Requirements

- Node.js 22 or newer and npm
- Git
- A Supabase project with the matching database schema, database functions, authentication, and row-level security policies

The database setup scripts were not included in the supplied files. Obtain those scripts from the original project before expecting database-backed features to work.

## 1. Download and install

```sh
git clone https://github.com/mulaillallu2011/startup-management.git
cd startup-management
npm ci
```

If using the copy inside `mulail-portfolio`, run app commands from its `startup-management` subfolder instead of the portfolio root.

## 2. Configure the local environment

Create `.env.local` in the app root and enter your own project's settings:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Use a Supabase publishable key here, never a service-role key. `.env.local` is ignored by Git. Do not upload credentials, database passwords, service-role keys, or real customer/student data. The browser can access the public key, so database access must be enforced through Supabase policies.

## 3. Prepare Supabase

1. Obtain and review the original SQL migrations, function definitions, and access policies. No migrations are included here.
2. Apply them to a development Supabase project before using real records.
3. Configure email/password authentication and the appropriate site and redirect URLs.
4. Create a test account and its corresponding `profiles` record using trusted administrative setup. The dashboard requires an `admin` profile.
5. Check that signed-out and ordinary users cannot read or change admin-only data. Confirm that users cannot promote their own roles.

The source references these tables:

| Area | Tables |
| --- | --- |
| Accounts and settings | `profiles`, `company_settings` |
| Products and stock | `products`, `inventory_movements` |
| Purchasing and sales | `suppliers`, `purchases`, `sales` |
| Classes and payments | `students`, `courses`, `batches`, `batch_students`, `payments` |

Required database functions: `adjust_inventory`, `create_purchase`, `create_sale`, and `record_student_payment`. Their call parameters are in the corresponding inventory, purchases, sales, and payments pages. Creating empty tables alone is not enough to reproduce the backend.

## 4. Start development

```sh
npm run dev
```

Open `http://localhost:3000`. The home page sends visitors to `/login`. Sign in using a test admin account from your configured Supabase project.

The login currently offers a User option that points to `/user`, but that route was not supplied. Implement the user area or remove that option before a public app launch.

## Project structure

```text
app/
  login/                 Sign-in screen
  dashboard/             Admin layout, shared UI, and feature pages
  globals.css            Global styles
lib/supabase/
  client.ts              Browser Supabase client
  server.ts              Server Supabase client
  proxy.ts               Session refresh and sign-in redirect
proxy.ts                 Next.js request proxy
public/                  Static assets
```

## 5. Develop a feature

1. Create a branch, for example `git switch -c feature/your-feature`.
2. Locate the matching page under `app/dashboard/`. Reuse the shared navigation, header, confirmation dialog, and loading/error components where appropriate.
3. For database changes, add reviewed SQL migrations and access policies to version control. Keep migration files free of credentials and real records.
4. Implement the UI and data handling. Treat client-side role selection as presentation only; enforce permissions in server checks and database policies.
5. Test with development data: loading, empty results, invalid inputs, failures, successful updates, and role restrictions. Check mobile layouts and keyboard use.
6. Run the checks below, inspect `git diff`, and commit only the intended source changes.
7. Push your branch and open a pull request describing the change and what was tested.

## 6. Check and build

```sh
npm run lint
npx tsc --noEmit
npm run build
npm start
```

Set the environment variables before building. `npm start` serves the production build; it is not the development command. Use a separate development database for testing stock, billing, and payments.

## 7. Deploy when ready

This application requires a Next.js server because it uses cookies, server-side authentication, and a request proxy. GitHub Pages cannot host the running app.

1. Resolve the known gaps below and verify the database policies and workflows.
2. Import the standalone repository into a Next.js-capable host. Use the repository root as the app directory. For the portfolio copy, use `startup-management` as the app directory.
3. Configure the two Supabase environment variables in the hosting service; do not commit an environment file.
4. Build and deploy, then update the Supabase site/redirect configuration for the chosen domain.
5. Verify sign-in, sign-out, redirects, access restrictions, and each database-backed workflow on the deployment before inviting users.

No live deployment is asserted by this README.

## Current validation and next steps

- Lint, TypeScript checks, and the production build passed using dummy Supabase settings.
- The local production login screen rendered; signed-out access to `/dashboard` redirected to `/login`.
- Real sign-in, database functions, data changes, and row-level security remain unverified.
- Supply versioned database migrations and policies, and resolve the missing `/user` route.
- The supplied dependency installation reported eight high-severity audit findings. Review `npm audit`, apply compatible fixes, and rerun checks before production deployment.
- Add meaningful automated tests for permissions, inventory changes, billing, and payment calculations.

The uploaded source includes a small TypeScript correction removing unsupported props from `MobileNav`, plus an explicit bundler root so it builds independently inside a larger checkout.
