import { List, Datagrid, TextField, EmailField, ImageField, EditButton, ShowButton } from "react-admin";

export const GuideList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="guide_id" label="ID гида" />
      <TextField source="user_id" label="ID пользователя" />
      <TextField source="user_name" label="Имя" />
      <EmailField source="user_email" label="Email" />
      <TextField source="user_phone" label="Телефон" />
      <ImageField source="photo" label="Фото" />
      <EditButton />
      <ShowButton />
    </Datagrid>
  </List>
);
