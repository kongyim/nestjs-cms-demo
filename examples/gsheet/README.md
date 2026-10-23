# Google Sheets import examples

`data.json` and the CSV files contain the same 13 sample records uploaded to the
configured spreadsheet: 3 categories, 6 pages, 2 roles, 2 users.

Each tab is named after its resource. `_key` is the permanent import identity.
`categoryId@categories` and `roleId@roles` contain another tab's `_key` values.
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
