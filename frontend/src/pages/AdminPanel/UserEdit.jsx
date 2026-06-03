import { Edit, SimpleForm, TextInput, BooleanInput, SaveButton, Toolbar } from "react-admin";

const CustomToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
);

export const UserEdit = () => (
  <Edit>
    <SimpleForm toolbar={<CustomToolbar />}>
      <TextInput source="id" label="ID" disabled />
      <TextInput source="name" label="Имя" />
      <TextInput source="email" label="Email" type="email" />
      <TextInput source="phone" label="Телефон" />
      <BooleanInput source="is_active" label="Активен" />
      <BooleanInput source="is_superuser" label="Админ" />
      <BooleanInput source="is_verified" label="Подтвержден" />
      <BooleanInput source="is_guide" label="Гид" />
    </SimpleForm>
  </Edit>
);
