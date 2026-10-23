'use client';

import { Autocomplete, TextField } from '@mui/material';
import type { FieldRendererProps } from '@nestjs-cms/admin';

export default function TagField({
  field,
  values,
  disabled,
  onChange,
}: FieldRendererProps) {
  const current = values[field.field];
  const tags = Array.isArray(current)
    ? current.filter((value): value is string => typeof value === 'string')
    : [];
  return (
    <Autocomplete
      multiple
      freeSolo
      autoSelect
      disabled={disabled}
      options={(field.items ?? []).map((item) => item.value)}
      value={tags}
      onChange={(_event, next) =>
        onChange({
          ...values,
          [field.field]: [
            ...new Set(next.map((value) => value.trim()).filter(Boolean)),
          ],
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={field.label}
          helperText="Choose a suggestion or type a tag and press Enter."
        />
      )}
    />
  );
}
