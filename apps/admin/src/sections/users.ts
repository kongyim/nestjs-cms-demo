import type { SectionConfig } from '../configs/types';
const roles = { resource: 'roles', labelField: 'name' };
export const usersSection: SectionConfig = {
  key: 'users',
  label: 'Users',
  singular: 'user',
  description: 'Manage accounts, assign roles, and control sign-in access.',
  readPermission: 'users:manage',
  writePermission: 'users:manage',
  defaults: { email: '', displayName: '', roleId: '', active: true },
  listFields: [
    { field: 'displayName', label: 'Name' },
    { field: 'email', label: 'Email' },
    { field: 'roleId', label: 'Role', itemsFrom: roles },
    { field: 'active', label: 'Active', type: 'boolean' },
  ],
  searchFields: [
    { field: 'email', label: 'Email', type: 'text' },
    {
      field: 'active',
      label: 'Active',
      type: 'select',
      boolean: true,
      items: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ],
    },
  ],
  formFields: [
    {
      field: 'displayName',
      label: 'Display name',
      type: 'text',
      required: true,
      maxLength: 120,
    },
    {
      field: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      maxLength: 254,
    },
    {
      field: 'roleId',
      label: 'Role',
      type: 'select',
      required: true,
      itemsFrom: roles,
      hint: 'Create a role first if no roles are available.',
    },
    {
      field: 'active',
      label: 'Allow sign-in',
      type: 'checkbox',
      hint: 'Disabling an account immediately blocks access. Keep an active administrator account available.',
    },
  ],
  passwordAction: {
    path: (id) => `/auth/users/${encodeURIComponent(id)}/password`,
    hint: 'Create the account first, then set its password to enable sign-in. Setting a password signs this user out of all sessions.',
  },
};
