import { defineSection } from '@nestjs-cms/admin';
export default defineSection({
  key: 'roles',
  label: 'Roles',
  singular: 'role',
  description: 'Define what each team member can access.',
  readPermission: 'users:manage',
  writePermission: 'users:manage',
  defaults: { name: '', permissions: [] },
  listFields: [
    { field: 'name', label: 'Name' },
    { field: 'permissions', label: 'Permissions' },
  ],
  searchFields: [{ field: 'name', label: 'Name', type: 'text' }],
  formFields: [
    {
      field: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      maxLength: 80,
    },
    {
      field: 'permissions',
      label: 'Permissions',
      type: 'checkboxes',
      items: [
        { value: 'pages:read', label: 'View pages and categories' },
        {
          value: 'pages:write',
          label: 'Create, edit, and delete pages and categories',
        },
        { value: 'users:manage', label: 'Manage users, passwords, and roles' },
      ],
      hint: 'Editors need both page permissions. User management grants full administrative access. Keep at least one administrator role available.',
    },
  ],
});
