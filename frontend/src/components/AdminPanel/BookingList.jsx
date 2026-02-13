import { List, Datagrid, TextField, NumberField, DateField, ShowButton } from "react-admin";

export const BookingList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="booking_id" label="ID бронирования" />
      <TextField source="excursion_title" label="Экскурсия" />
      <DateField source="date" label="Дата и время" showTime />
      <NumberField source="number_of_people" label="Количество человек" />
      <TextField source="status" label="Статус" />
      <TextField source="payment_status" label="Статус оплаты" />
      <TextField source="client_name" label="Клиент" />
      <EmailField source="client_email" label="Email клиента" />
      <NumberField source="total_amount" label="Сумма" />
      <ShowButton />
    </Datagrid>
  </List>
);
