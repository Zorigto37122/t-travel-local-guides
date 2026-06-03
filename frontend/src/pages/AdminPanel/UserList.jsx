import { List, Datagrid, TextField, EmailField, BooleanField, EditButton, ShowButton } from "react-admin";

export const UserList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" label="ID" />
      <TextField source="name" label="Имя" />
      <EmailField source="email" label="Email" />
      <TextField source="phone" label="Телефон" />
      <BooleanField source="is_active" label="Активен" />
      <BooleanField source="is_superuser" label="Админ" />
      <BooleanField source="is_verified" label="Подтвержден" />
      <BooleanField source="is_guide" label="Гид" />
      <EditButton />
      <ShowButton />
    </Datagrid>
  </List>
);
