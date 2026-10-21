import type { SectionConfig } from '../configs/types';
const statuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
];
export const pagesSection: SectionConfig = {
  key: 'pages',
  label: 'Pages',
  singular: 'page',
  description: 'Create and publish your website content.',
  readPermission: 'pages:read',
  writePermission: 'pages:write',
  defaults: { title: '', status: 'draft', categoryId: null },
  listFields: [
    {
      field: 'categoryId',
      label: 'Category',
      itemsFrom: { resource: 'categories', labelField: 'name' },
    },
    { field: 'title', label: 'Title' },
    { field: 'status', label: 'Status' },
    { field: 'updatedAt', label: 'Updated', type: 'date' },
  ],
  searchFields: [
    { field: 'title', label: 'Title', type: 'text' },
    { field: 'status', label: 'Status', type: 'select', items: statuses },
  ],
  formFields: [
    {
      field: 'categoryId',
      label: 'Category',
      type: 'select',
      nullable: true,
      itemsFrom: { resource: 'categories', labelField: 'name' },
      hint: 'Choose a category, or leave this page uncategorized.',
    },
    {
      field: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      maxLength: 200,
    },
    {
      field: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      items: statuses,
    },
  ],
};
