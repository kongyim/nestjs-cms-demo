export type FieldValue =
  | string
  | number
  | boolean
  | FieldValue[]
  | { [key: string]: FieldValue }
  | null;
export type FormValues = Record<string, FieldValue>;
export type ResourceRecord = FormValues & { id: string };
export type ResourceList = {
  data: ResourceRecord[];
  meta: { page: number; total: number; totalPages: number };
};
export type Option = { value: string; label: string };
export type FormField = {
  field: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'url'
    | 'textarea'
    | 'number'
    | 'date'
    | 'datetime-local'
    | 'json'
    | 'select'
    | 'checkbox'
    | 'checkboxes'
    | 'attachment';
  accept?: string;
  multiple?: boolean;
  required?: boolean;
  nullable?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
  items?: Option[];
  itemsFrom?: { resource: string; labelField: string };
};
export type SectionConfig = {
  key: string;
  label: string;
  singular: string;
  description: string;
  readPermission: string;
  writePermission: string;
  defaults: FormValues;
  listFields: {
    field: string;
    label: string;
    type?: 'date' | 'boolean';
    itemsFrom?: { resource: string; labelField: string };
  }[];
  searchFields: {
    field: string;
    label: string;
    type: 'text' | 'select';
    items?: Option[];
    boolean?: boolean;
  }[];
  formFields: FormField[];
  passwordAction?: { path: (id: string) => string; hint: string };
};
