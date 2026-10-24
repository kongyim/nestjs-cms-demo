# Google Sheets import examples

`data.json` and the CSV files contain the same 13 sample records uploaded to the
configured spreadsheet: 3 categories, 6 pages, 2 roles, 2 users.

Each tab is named after its resource. `_key` is the permanent import identity.
`categoryId` and `roleId` contain another tab's `_key` values; targets are inferred
from the resource's foreign keys. The older `categoryId@categories` and `roleId@roles`
headers are also supported.
Translations use separate dotted columns, and string arrays accept comma-separated
values. Other JSON fields use JSON text. Dates use ISO text.

The original spreadsheet tabs were copied to `_original_*` tabs before correction;
those backups are ignored because they do not match registered resource names.
The example users are inactive and have no passwords. To enable login, set a password
and activate them in the admin portal. The bootstrap administrator is not overwritten.

Keep `_key` stable after the first import. Repeating an import updates existing
imported records; removing a sheet row does not delete a database record. Blank cells
preserve existing values on updates, while the text `null` clears nullable fields.

Use `npm run database:import -- --dry-run` to check schema and references first,
then `npm run database:import`. SQL constraints and resource hooks are checked on
actual imports, which roll back the complete batch on failure.

Spreadsheet imports also support dotted columns such as `translations.en`,
`translations.tc`, and `translations.sc`. These are assembled into the nested JSON
object. Blank cells preserve stored siblings on updates; new rows use object defaults.
Do not mix a whole-object `translations` column with dotted translation columns.

String-array fields accept comma-separated values: `help, news` becomes
`["help", "news"]`. Values are trimmed and empty entries are discarded. JSON arrays
remain supported; use `[]` to clear an array. Object arrays such as `blocks` still
require JSON. The demo accepts nonempty string tags, including `hello` and `world`. The admin tag
editor supports custom tags as well as the existing suggestions. Other resource
string-enum arrays still enforce their own allowed values.

## Attachment columns

Add `cover` for a single image URL and `documents` for comma-separated
file URLs to the `pages` tab. The resource definition determines which fields
are attachments and whether they accept multiple files. For example:

| cover | documents |
| --- | --- |
| https://example.com/cover.jpg | https://example.com/guide.pdf, https://example.com/terms.pdf |

Use public direct download URLs. Covers accept PNG/JPEG (up to 5 MB); documents
accept PDF/plain text (up to 10 MB), also subject to the global attachment limit.
Blank cells preserve existing files. Reimporting the same URLs does not duplicate
attachments. Single URLs replace the previous file; multiple URLs append files.
Removing a URL from a cell does not remove an existing attachment.

`npm run database:import -- --dry-run` downloads and validates the linked files
without uploading or writing records. Then run `npm run database:import` to store
them using the configured attachment storage. Failed imports leave pending uploads
for the regular storage cleanup job. Percent-encode commas inside URLs as `%2C`.
