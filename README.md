# NestJS CMS Demo

An npm workspace with a NestJS API and a Next.js admin.

```text
apps/
  api/       NestJS API, resource definitions, and API tests
  admin/     Next.js admin (App Router)
docker/      MinIO build and bucket initialization
.env         Local API and Docker Compose configuration (not committed)
docker-compose.yml
```

## Setup

Use Node.js 22 or later and Docker Compose. From the repository root:

```bash
npm install
docker compose up -d --build
docker compose logs minio-init
```

The API depends on the local package archive at
`../nestjs-cms/nestjs-cms-0.1.0.tgz` relative to this repository. Keep that sibling
archive available when installing dependencies. The admin also requires
`../nestjs-cms/packages/admin/nestjs-cms-admin-0.1.0.tgz`; see the reusable
admin package instructions below to build it before installing.

Wait for PostgreSQL and MinIO to be healthy and `minio-init` to finish
successfully. The first build compiles MinIO from pinned source and can take
several minutes. The initializer creates the private bucket named by `S3_BUCKET`.

## Development

Run these commands in separate terminals from the repository root:

```bash
npm run dev:api
npm run dev:admin
```

- API: http://localhost:3000
- Admin: http://localhost:3001
- MinIO console: http://localhost:9001
- pgAdmin 4: http://localhost:8080

Start pgAdmin and PostgreSQL with `docker compose up -d pgadmin`. Sign in with
`PGADMIN_DEFAULT_EMAIL` and `PGADMIN_DEFAULT_PASSWORD` from `.env`. The
**CMS PostgreSQL** connection is preloaded on first startup; open it and enter
`DB_PASSWORD` from `.env`. Inside Compose, the database host is `postgres` and
the port is `5432`. pgAdmin settings persist in the `pgadmin-data` volume;
changing its default login variables does not reset an existing account.

The admin manages pages, categories, roles, and users with searchable, paginated lists and
create/edit/delete forms. User accounts include role assignment, active status,
and an inline password field saved with the other account details. Navigation follows the signed-in user’s permissions.
Sign in with your email and password. The portal uses a server-side session
with an HttpOnly cookie; the shared API key stays on the API server.

During development, Next.js proxies `/api/:path*` to
`http://localhost:3000/api/:path*` via a rewrite. Browser requests stay on the
admin origin. The API continues to load the root `.env`, including PostgreSQL
and MinIO settings; no copy of that file is needed in either app.

## Administrator login, users, and roles

Before the first API startup, add these values to your root `.env`:

```dotenv
ADMIN_ORIGIN=http://localhost:3001
ADMIN_BOOTSTRAP_EMAIL=admin@example.com
ADMIN_BOOTSTRAP_PASSWORD=replace-with-a-unique-long-password
DB_SYNCHRONIZE=true
```

Choose your own password (12–128 characters). Start the API and admin, then sign
in at http://localhost:3001. Bootstrap creates an Administrator role and account
only when the users table is empty. Remove the bootstrap variables after the
first successful startup. Existing accounts and passwords are never overwritten.
`DB_SYNCHRONIZE=true` creates the new tables in development only; production
needs a reviewed schema migration for `roles`, `users`, `admin_credentials`, and
`admin_sessions`, including their foreign keys. The category feature also needs
the `categories` table and nullable `pages.categoryId` foreign key.

Resources are discovered from `apps/api/src/resources`:

- `users`: unique, normalized email, display name, role ID, and active status.
- `roles`: unique name and a list of permissions. Referenced roles cannot be deleted.
- `categories`: unique category name. Categories referenced by pages cannot be deleted.
- `pages`: title, status, and optional `categoryId`; existing pages remain uncategorized.

Permissions are `pages:read`, `pages:write`, and `users:manage`. Page permissions
also govern category access. Include both page
permissions for an editor; `users:manage` grants full control of accounts, passwords,
and roles and should be reserved for trusted administrators. Users have one role.
New roles have no permissions by default. New users cannot sign in until their
password is set. Manage all four resources in the portal or through the authenticated API.
A role with read access alone gets a read-only page editor.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/auth/login` | Send `{ "email": "…", "password": "…" }`; sets a session cookie |
| `GET /api/auth/me` | Current account and permissions |
| `POST /api/auth/logout` | Revoke the session and clear the cookie |
| `GET/POST /api/users` | List or create users (`users:manage`) |
| `PATCH/DELETE /api/users/:id` | Update or delete a user (`users:manage`) |
| `GET/POST /api/roles` | List or create roles (`users:manage`) |
| `PATCH/DELETE /api/roles/:id` | Update or delete a role (`users:manage`) |
| `PUT /api/auth/users/:id/password` | Set `{ "password": "…" }` and revoke that user's sessions (`users:manage`) |

Use a cookie-aware API client: log in, create a role with e.g.
`{ "name": "Editor", "permissions": ["pages:read", "pages:write"] }`, create a user
with `{ "email": "editor@example.com", "displayName": "Editor", "roleId": "<role ID>" }`,
then set that user's password. All mutations, including login and logout, require
`X-CMS-Request: 1`. Browser origins must match `ADMIN_ORIGIN` exactly. No public
registration or password-reset-by-email flow is enabled. Keep an administrator
account available when changing roles or disabling users.

Passwords use salted scrypt hashes in a separate, non-resource table. Sessions
store only a digest of a random token and expire after eight hours. Logout and
password changes revoke sessions; disabled users and current role permissions
are checked on every request. Expired sessions are cleaned up on login. Requests
without sessions fail even if they supply `X-API-Key`. If `ADMIN_API_KEY` is set,
the host guard supplies it internally after checking session permissions.

For production, use HTTPS, set `NODE_ENV=production` (Secure cookies), configure
`ADMIN_ORIGIN` to the public admin origin, and route `/api/*` to NestJS on that
same origin. The installed CMS package still requires a server-only
`ADMIN_API_KEY` of at least 32 characters in production. Login throttling currently
uses per-process IP/global limits; multi-instance deployments need a shared
limiter or equivalent ingress limits. Proxy IPs are not trusted by default.

## Build and checks

```bash
npm run build             # Build both apps
npm run build:api
npm run build:admin
npm test                  # API unit tests
npm run typecheck:admin
npm run test:e2e           # Auth integration tests; see disposable database setup below
```

After building, `npm run start:api` and `npm run start:admin` start the respective
production servers. The API rewrite is development-only; production hosting
must route `/api/*` to the API on the same origin.

## Local storage

The host API connects to PostgreSQL on `127.0.0.1:5432` and MinIO on
`http://127.0.0.1:9000`. Use `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` from
`.env` to sign into the MinIO console. The supplied credentials are for local
development.

Both services retain data in Docker volumes. `docker compose down` preserves
that data; `docker compose down -v` deletes it. PostgreSQL credentials initialize
a new volume only; changing `.env` does not change an existing database user.

## Authentication integration tests

Use a fresh disposable PostgreSQL database, never the development database. The
suite creates test users and requires the database name to end in `_test`:

```bash
AUTH_TEST_DATABASE=1 DB_TYPE=postgres DB_HOST=127.0.0.1 DB_PORT=55439 \
DB_USERNAME=cms_test DB_PASSWORD=cms_test_local DB_DATABASE=cms_auth_test \
DB_SYNCHRONIZE=true ADMIN_API_KEY=integration-test-server-key \
ADMIN_ORIGIN=http://localhost:3001 \
npm run test:e2e --workspace=@nestjs-cms-demo/api -- --runInBand --watchman=false
```

Provision the database before running this command and discard it afterward.
The suite covers login, CSRF rejection, permission enforcement, credential
isolation, disabled accounts, password changes, logout, expiry, and throttling.

## Reusable admin package

The shared frontend now lives in `../nestjs-cms/packages/admin` as
`@nestjs-cms/admin`. This demo installs its local package archive. Before a fresh
install, build and pack it in the sibling repository:

```bash
cd ../nestjs-cms/packages/admin
npm install
npm run build
npm test
npm pack
```

Then run `npm install` in this demo. After changing the package, repack it and run
this command from the demo root to refresh the installed copy:

```bash
npm install --workspace=@nestjs-cms-demo/admin ../nestjs-cms/packages/admin/nestjs-cms-admin-0.1.0.tgz
```

The host frontend is now configuration plus a small Next.js shell:

```text
apps/admin/src/
  admin.config.ts       Branding, API URL, default section, and discovered sections
  sections.generated.ts Generated imports; do not edit
  sections/
    pages.ts            Page fields and permissions
    categories.ts       Category fields and permissions
    roles.ts            Role fields and permissions
    users.ts            Account fields and inline password action
```

To add a section, create a `.ts` file in `apps/admin/src/sections` that default-exports
`defineSection({ ... })` from `@nestjs-cms/admin`. Set `order` to control navigation.
No registry changes are needed: `npm run dev:admin` watches additions and removals,
and build/typecheck regenerate imports automatically. Restart the dev command
once after migrating from the old setup so the section watcher starts.

The package supplies navigation, lists, filters, forms, theme, image previews,
deferred attachment updates, nested JSON dot paths, and password actions.
Configurations retain `listFields`, `searchFields`, `formFields`, defaults, and
read/write permissions. All fields—including attachments and passwords—follow
`formFields` order. The host API must still expose and authorize each resource.

The default authentication adapter uses this demo's cookie-session endpoints.
Other consumers can configure authentication, transport, permissions, branding,
custom field renderers, and theme. See `../nestjs-cms/packages/admin/README.md`
for the package API and minimal setup. The package ships compiled CSS and does
not require consumers to configure Tailwind. The Next.js host retains Material
UI's App Router cache provider and the same-origin API proxy.
