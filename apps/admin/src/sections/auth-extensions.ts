import type { AuthSectionExtensions } from '@nestjs-cms/admin';

const authExtensions: AuthSectionExtensions = {
  users: {
    defaults: { phone: null },
    formFields: [
      {
        field: 'phone',
        label: 'Phone',
        type: 'text',
        nullable: true,
        maxLength: 30,
        hint: 'Optional contact phone number.',
      },
    ],
    listFields: [{ field: 'phone', label: 'Phone' }],
    searchFields: [{ field: 'phone', label: 'Phone', type: 'text' }],
  },
  roles: {
    defaults: { description: null },
    formFields: [
      {
        field: 'description',
        label: 'Description',
        type: 'textarea',
        nullable: true,
        maxLength: 500,
        hint: 'Explain who this role is intended for.',
      },
    ],
    listFields: [{ field: 'description', label: 'Description' }],
  },
};
export default authExtensions;
