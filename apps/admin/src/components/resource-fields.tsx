'use client';

import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  MenuItem,
  TextField,
} from '@mui/material';
import type { FormField, FormValues, Option } from '../configs/types';

export default function ResourceFields({
  fields,
  values,
  options,
  disabled,
  onChange,
}: {
  fields: FormField[];
  values: FormValues;
  options: Record<string, Option[]>;
  disabled: boolean;
  onChange: (values: FormValues) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {fields.map((field) => {
        const value = values[field.field];
        const items = field.itemsFrom
          ? (options[field.itemsFrom.resource] ?? [])
          : (field.items ?? []);
        if (field.type === 'checkboxes')
          return (
            <FormControl
              key={field.field}
              component="fieldset"
              disabled={disabled}
            >
              <FormLabel component="legend">{field.label}</FormLabel>
              <FormGroup>
                {items.map((item) => (
                  <FormControlLabel
                    key={item.value}
                    label={item.label}
                    control={
                      <Checkbox
                        checked={
                          Array.isArray(value) && value.includes(item.value)
                        }
                        onChange={(event) => {
                          const current = Array.isArray(value) ? value : [];
                          onChange({
                            ...values,
                            [field.field]: event.target.checked
                              ? [...current, item.value]
                              : current.filter((entry) => entry !== item.value),
                          });
                        }}
                      />
                    }
                  />
                ))}
              </FormGroup>
              <FormHelperText>{field.hint}</FormHelperText>
            </FormControl>
          );
        if (field.type === 'checkbox')
          return (
            <FormControl key={field.field} disabled={disabled}>
              <FormControlLabel
                label={field.label}
                control={
                  <Checkbox
                    checked={value === true}
                    onChange={(event) =>
                      onChange({
                        ...values,
                        [field.field]: event.target.checked,
                      })
                    }
                  />
                }
              />
              <FormHelperText>{field.hint}</FormHelperText>
            </FormControl>
          );
        return (
          <TextField
            key={field.field}
            id={`field-${field.field}`}
            label={field.label}
            type={field.type === 'select' ? undefined : field.type}
            select={field.type === 'select'}
            value={value ?? ''}
            disabled={disabled}
            required={field.required}
            helperText={field.hint}
            slotProps={{ htmlInput: { maxLength: field.maxLength } }}
            onChange={(event) =>
              onChange({
                ...values,
                [field.field]:
                  field.nullable && event.target.value === ''
                    ? null
                    : event.target.value,
              })
            }
          >
            {field.type === 'select'
              ? [
                  <MenuItem key="empty" value="">
                    {field.nullable ? 'Uncategorized' : 'Select…'}
                  </MenuItem>,
                  ...items.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  )),
                ]
              : null}
          </TextField>
        );
      })}
    </div>
  );
}
