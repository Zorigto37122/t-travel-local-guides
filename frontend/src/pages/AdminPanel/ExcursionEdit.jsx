import { Edit, SimpleForm, TextInput, NumberInput, SelectInput, SaveButton, Toolbar } from "react-admin";

const CustomToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
);

export const ExcursionEdit = () => (
  <Edit>
    <SimpleForm toolbar={<CustomToolbar />}>
      <TextInput source="excursion_id" label="ID" disabled />
      <TextInput source="title" label="Название" fullWidth />
      <TextInput source="country" label="Страна" />
      <TextInput source="city" label="Город" />
      <TextInput source="difficulty" label="Сложность" />
      <TextInput source="description" label="Описание" multiline fullWidth />
      <TextInput source="photos" label="Фото (URL через запятую)" fullWidth />
      <NumberInput source="price_per_person" label="Цена за человека" />
      <TextInput source="accepted_payment_methods" label="Способы оплаты" />
      <NumberInput source="available_slots" label="Доступные места" />
      <SelectInput
        source="status"
        label="Статус"
        choices={[
          { id: "approved", name: "Одобрена" },
          { id: "pending_review", name: "На модерации" },
          { id: "draft", name: "Черновик" },
        ]}
      />
    </SimpleForm>
  </Edit>
);
