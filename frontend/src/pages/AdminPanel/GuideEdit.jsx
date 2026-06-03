import { Edit, SimpleForm, TextInput, ImageField, SaveButton, Toolbar } from "react-admin";

const CustomToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
);

export const GuideEdit = () => (
  <Edit>
    <SimpleForm toolbar={<CustomToolbar />}>
      <TextInput source="guide_id" label="ID гида" disabled />
      <TextInput source="user_id" label="ID пользователя" disabled />
      <TextInput source="user_name" label="Имя" disabled />
      <TextInput source="user_email" label="Email" disabled />
      <TextInput source="user_phone" label="Телефон" disabled />
      <ImageField source="photo" label="Текущее фото" />
      <TextInput source="photo" label="URL фото" fullWidth />
    </SimpleForm>
  </Edit>
);
