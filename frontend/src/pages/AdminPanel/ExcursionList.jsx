import { List, Datagrid, TextField, NumberField, SelectField, EditButton, ShowButton, DeleteButton, Filter, SelectInput } from "react-admin";

const ExcursionFilter = (props) => (
  <Filter {...props}>
    <SelectInput
      source="status"
      label="Статус"
      choices={[
        { id: "approved", name: "Одобрена" },
        { id: "pending_review", name: "На модерации" },
        { id: "draft", name: "Черновик" },
      ]}
      alwaysOn
    />
  </Filter>
);

export const ExcursionList = () => (
  <List filters={<ExcursionFilter />}>
    <Datagrid rowClick="show">
      <TextField source="excursion_id" label="ID" />
      <TextField source="title" label="Название" />
      <TextField source="city" label="Город" />
      <TextField source="country" label="Страна" />
      <NumberField source="price_per_person" label="Цена за человека" />
      <SelectField
        source="status"
        label="Статус"
        choices={[
          { id: "approved", name: "Одобрена" },
          { id: "pending_review", name: "На модерации" },
          { id: "draft", name: "Черновик" },
        ]}
      />
      <EditButton />
      <ShowButton />
      <DeleteButton />
    </Datagrid>
  </List>
);
