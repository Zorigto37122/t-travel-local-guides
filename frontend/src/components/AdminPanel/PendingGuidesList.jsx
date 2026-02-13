import { List, Datagrid, TextField, EmailField, FunctionField, useNotify, useRefresh } from "react-admin";
import { adminApproveGuide } from "../../api";
import { useAuth } from "../../AuthContext";

const ApproveButton = ({ record }) => {
  const notify = useNotify();
  const refresh = useRefresh();
  const { token } = useAuth();

  const handleApprove = async (approved) => {
    try {
      await adminApproveGuide(token, record.user_id, approved);
      notify(approved ? "Гид одобрен" : "Заявка отклонена", { type: "success" });
      refresh();
    } catch (error) {
      notify(error.message || "Ошибка при обработке заявки", { type: "error" });
    }
  };

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <button
        onClick={() => handleApprove(true)}
        style={{
          padding: "6px 12px",
          backgroundColor: "#4caf50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        Одобрить
      </button>
      <button
        onClick={() => handleApprove(false)}
        style={{
          padding: "6px 12px",
          backgroundColor: "#f44336",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        Отклонить
      </button>
    </div>
  );
};

export const PendingGuidesList = () => (
  <List title="Заявки на гиды, ожидающие одобрения">
    <Datagrid>
      <TextField source="user_id" label="ID пользователя" />
      <TextField source="user_name" label="Имя" />
      <EmailField source="user_email" label="Email" />
      <TextField source="user_phone" label="Телефон" />
      <FunctionField
        label="Действия"
        render={(record) => <ApproveButton record={record} />}
      />
    </Datagrid>
  </List>
);
