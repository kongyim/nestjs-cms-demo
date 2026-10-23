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

Use Node.js 22 or later and Docker Compose. Until the new CMS releases are
published, this repository installs the packages from the sibling `../nestjs-cms`
checkout through `file:` dependencies. `.npmrc` enables `install-links` so npm
installs built package contents rather than symlinking their source trees.

For the first setup, install the library's build dependencies, then build and
install all three packages from this repository root:

```bash
npm --prefix ../nestjs-cms ci
npm --prefix ../nestjs-cms run build
npm --prefix ../nestjs-cms/packages/auth ci
npm --prefix ../nestjs-cms/packages/admin ci
npm run dev:cms:local
docker compose up -d --build
docker compose logs minio-init
```

The API uses `@nestjs-cms/core` and `@nestjs-cms/auth`; the frontend uses
`@nestjs-cms/admin`. The auth module supplies users, roles, password handling,
sessions, and API permission checks. Application code defines pages and categories.

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
- Admin: http://localhost:3001/admin
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

Set the admin prefix in the repository root `.env`:

```dotenv
ADMIN_BASE_PATH=/admin
```

This defaults to `/admin`. The admin opens at `http://localhost:3001/admin`,
and browser API requests use `http://localhost:3001/admin/api/pages`,
`/admin/api/auth/login`, and so on. Next.js proxies these to the existing NestJS
`http://localhost:3000/api/*` endpoints in both development and production.
Resources use hash navigation, for example `/admin#/pages`.

Change the value to `/cms` or `/tools/cms` to move both the UI and API proxy.
Use `ADMIN_BASE_PATH=` to serve the admin at `/` and the proxy at `/api`.
Trailing slashes are removed. Restart both admin and API servers after changes and
sign in again so the session cookie uses the new path; production
requires rebuilding because Next.js embeds the base path in browser assets.
The root `.env` is loaded automatically; existing process or app-local environment
variables take precedence. Only the resolved public path is exposed to the browser.
The API continues to use the shared root `.env` for its own settings.

## Administrator login, users, and roles

Before the first API startup, add these values to your root `.env`:

```dotenv
ADMIN_ORIGIN=http://localhost:3001
ADMIN_BOOTSTRAP_EMAIL=admin@example.com
ADMIN_BOOTSTRAP_PASSWORD=replace-with-a-unique-long-password
DB_SYNCHRONIZE=true
```

Choose your own password (12–128 characters). Start the API and admin, then sign
in at http://localhost:3001/admin. Bootstrap creates an Administrator role and account
only when the users table is empty. Remove the bootstrap variables after the
first successful startup. Existing accounts and passwords are never overwritten.
`DB_SYNCHRONIZE=true` creates the new tables in development only; production
needs a reviewed schema migration for `roles`, `users`, `admin_credentials`, and
`admin_sessions`, including their foreign keys. The category feature also needs
the `categories` table and nullable `pages.categoryId` foreign key.

`CmsAuthModule.forRoot(...)` in `apps/api/src/app.module.ts` registers the CMS
and authentication together. It reads the existing origin, admin prefix, and
bootstrap settings from `.env`. The module automatically supplies users and roles;
only pages and categories are discovered from `apps/api/src/resources`:

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

| Endpoint                           | Purpose                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `POST /api/auth/login`             | Send `{ "email": "…", "password": "…" }`; sets a session cookie            |
| `GET /api/auth/me`                 | Current account and permissions                                            |
| `POST /api/auth/logout`            | Revoke the session and clear the cookie                                    |
| `GET/POST /api/users`              | List or create users (`users:manage`)                                      |
| `PATCH/DELETE /api/users/:id`      | Update or delete a user (`users:manage`)                                   |
| `GET/POST /api/roles`              | List or create roles (`users:manage`)                                      |
| `PATCH/DELETE /api/roles/:id`      | Update or delete a role (`users:manage`)                                   |
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
the auth package guard supplies it internally after checking session permissions.

For production, use HTTPS, set `NODE_ENV=production` (Secure cookies), configure
`ADMIN_ORIGIN` to the public admin origin (without `/admin`). Next.js proxies
`/admin/api/*` to NestJS on `localhost:3000`; if deploying the API on another host,
update the rewrite destination in `apps/admin/next.config.ts`. The installed CMS package still requires a server-only
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
production servers. The prefixed API rewrite is enabled in both environments.

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

The shared frontend is provided by `@nestjs-cms/admin`. Roles and Users are
registered with `createAuthSections()` in `apps/admin/src/admin.config.ts`,
including the role selector, active status, and inline password action. The
configuration lists `pages:read` and `pages:write`; the helper also adds
`users:manage`.

The host frontend is now configuration plus a small Next.js shell:

```text
apps/admin/src/
  admin.config.ts       Branding, API URL, default section, and ordered section imports
  sections/
    pages.ts            Page fields and permissions
    categories.ts       Category fields and permissions
    dashboard.ts        Custom dashboard registration
```

To add a section, create a `.ts` file in `apps/admin/src/sections` that default-exports
`defineSection({ ... })` from `@nestjs-cms/admin`. Import it in `admin.config.ts` and
add it to the `sections` array. Navigation follows that array's order:

```ts
sections: [categories, pages, ...createAuthSections([
  { value: 'pages:read', label: 'View pages and categories' },
  { value: 'pages:write', label: 'Edit pages and categories' },
])],
```

Reorder the array to rearrange navigation, or remove an entry to hide that section.
There is no `order` property, generated registry, or discovery command.
`defaultSection` selects the initial screen without changing navigation order.

The package supplies navigation, lists, filters, forms, theme, image previews,
deferred attachment updates, nested JSON dot paths, and password actions.
Configurations retain `listFields`, `searchFields`, `formFields`, defaults, and
read/write permissions. All fields—including attachments and passwords—follow
`formFields` order. The host API must still expose and authorize each resource.

The default authentication adapter uses the auth package's cookie-session endpoints.
Other consumers can configure authentication, transport, permissions, branding,
custom field renderers, and theme. See `node_modules/@nestjs-cms/admin/README.md`
for the package API and minimal setup. The package ships compiled CSS and does
not require consumers to configure Tailwind. The Next.js host retains Material
UI's App Router cache provider and the same-origin API proxy.

The Pages configuration demonstrates full-width grouped forms. Within `formFields`,
use `width: 6` for two fields per row or `width: 4` for three; fields stack on mobile.
Groups use `{ type: 'group', key, label, description?, fields: [...] }`. Layout
changes do not affect the API payload or deferred attachment/password saves.

## Developing the CMS libraries locally

After changing the sibling core, auth, or admin package, run:

```bash
npm run dev:cms:local
npm run build:api
npm run typecheck:admin
```

This builds core, auth, and admin in order, then runs `npm ci` to refresh the
installed `file:` packages using the lockfile. Restart both dev servers afterward.
It is a build-and-copy workflow, not source watching. The library dependencies must
already be installed as described in Setup.

## Switching to published packages

Once core 0.1.3, auth 0.1.0, and admin 0.1.2 (or compatible newer versions) are on
npm, run from this repository root:

```bash
npm install @nestjs-cms/core@latest @nestjs-cms/auth@latest --workspace=@nestjs-cms-demo/api
npm install @nestjs-cms/admin@latest --workspace=@nestjs-cms-demo/admin
```

These commands replace the local `file:` dependencies and update the lockfile.
Commit both workspace manifests and the root lockfile. Future `npm ci` commands
will then use npm releases; the sibling checkout is no longer needed.

## Authentication migration

The copied `apps/api/src/auth` implementation and users/roles resource files have
been removed. The module uses the same table names, password hashes, session
digests, and endpoint contract, so keep the existing database and `.env` values.
Do not reset the database or bootstrap accounts again to perform this migration.
Review schema migrations before production deployment.

The category permission mapping explicitly preserves `pages:read` and
`pages:write`. New application resources default to `<resource>:read` and
`<resource>:write`; add their permission choices to `createAuthSections()` and
grant them to the appropriate roles. Existing roles are not automatically granted
new permissions. Keep the mapping in `app.module.ts` if resources share permissions.

The end-to-end suite still exercises the real package endpoints against a
separate disposable database. Tests set bootstrap variables before importing
`AppModule`, because module options are resolved at import time. The package's own
tests cover password hashing and cookie configuration; duplicate local unit tests
have been removed.

The dashboard is registered in `apps/admin/src/sections/dashboard.ts`, and its React
component lives in `apps/admin/src/components/dashboard.tsx`. It uses the library's
`useAdmin()` hook and shows links allowed by the current user's permissions.
Existing resource sections continue to use `defineSection()`. Use
`defineCustomSection({ key, label, component, readPermission? })` for additional pages.

## Custom user and role fields

This demo adds an optional **Phone** field to users (including list/search) and an
optional **Description** field to roles. Both are stored in the database, validated
by the API, and editable under the existing `users:manage` permission.

- API fields: `apps/api/src/auth-resource-extensions.ts`.
- Admin fields: `apps/admin/src/sections/auth-extensions.ts`.
- Shared auth module/migration configuration: `apps/api/src/auth.config.ts`.

After editing the library, run `npm run dev:cms:local` and restart both apps.
With `DB_SYNCHRONIZE=true`, the development API creates the nullable columns on
startup. Existing records and bootstrap accounts have null values for these fields.

For an existing database with synchronization disabled, review the included
`AuthExtraFields1792728000000` migration, back up the database, and apply it before
starting the updated API:

```bash
npm run build:api
node node_modules/typeorm/cli.js migration:run -d apps/api/dist/database/data-source.js
```

This migration adds two columns to existing `users` and `roles` tables; it is not
an initial database migration. Do not apply it after synchronization has already
created the columns. The CLI data source disables synchronization. No migration
is applied automatically by this update.

Extension schemas and columns must use matching field names. Give new fields
schema defaults (or optional schemas with nullable/defaulted database columns).
Built-in auth fields cannot be replaced. Admin defaults merge and field arrays
append; adding a UI field alone does not add an API/database field.

## Import from Google Sheets

The reusable implementation lives in `nestjs-cms/packages/import` (`@nestjs-cms/import`).
The API and CLI share the same resource schemas, key/reference mapping, validation,
transaction behavior, and resource limit.

Configure the repository root `.env`:

```dotenv
GSHEET_KEY_PATH=./key.json
GSHEET_ID=1vx2Ihaeracqix7O9OEasO8A8zAu3vjFhOaj5fsL-zfM
# Optional; blank/omitted means all registered resources with matching tabs.
GSHEET_IMPORT_RESOURCES=
# To limit imports instead: GSHEET_IMPORT_RESOURCES=categories,pages
```

The key stays server-side and is ignored by Git. Share the sheet with the service
account in the key. Only read access is required for importing. Relative key paths
resolve from this repository root, including when npm invokes the API workspace.

```bash
npm run dev:cms:local       # Rebuild/install changed local packages
npm run database:import -- --dry-run
npm run database:import
```

Start the API once (or apply schema migrations) before importing into a new database.
The CLI imports data only: it does not synchronize schemas or bootstrap administrators.
The dry run checks row schemas/references without writes; actual SQL uniqueness and
hook failures are caught during the transactional import.

The admin sidebar now includes **Import database** below all sections. Clicking it
runs the same import via `/admin/api/database/import` (or your configured prefix),
shows progress/results, and reloads the active section. Restart both apps after
changing the server-side environment. It requires `users:manage` and write permission
for every selected matching resource; users without management access cannot run it.

Tabs must match resource names. Use `_key` for each row's permanent unique key, and
headers such as `categoryId@categories` to reference keys in another resource:

```text
categories:  _key        name
             news       News

pages:       _key        title       categoryId@categories
             welcome    Welcome     news
```

The importer orders dependencies, supports booleans/numbers/JSON, uses resource
validation and hooks, and rolls back the whole batch on errors. Re-imports update
stable IDs, never duplicate the same keys or delete missing sheet rows. If a reference
tab is excluded by the resource limit, the referenced record must already exist from
a previous import. Existing manually-created records with conflicting unique names
or emails cause an error; they are not silently overwritten.

The populated sheet and `examples/gsheet/` contain 13 schema-valid dummy records,
including Phone and Description. Original tabs are preserved as `_original_*` backups.
The example users are inactive, with no passwords; use the existing admin password
action to enable test logins. Attachments and passwords are not imported from cells.
