import type { SectionConfig } from '../configs/types';

export const categoriesSection: SectionConfig = {
  key: 'categories',
  label: 'Categories',
  singular: 'category',
  description: 'Organize your pages into categories.',
  readPermission: 'pages:read',
  writePermission: 'pages:write',
  defaults: { name: '' },
  listFields: [
    { field: 'name', label: 'Name' },
    { field: 'updatedAt', label: 'Updated', type: 'date' },
  ],
  searchFields: [{ field: 'name', label: 'Name', type: 'text' }],
  formFields: [
    {
      field: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      maxLength: 120,
      hint: 'Category names must be unique. Categories in use by pages cannot be deleted.',
    },
  ],
};
