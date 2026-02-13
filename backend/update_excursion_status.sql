-- SQL команда для изменения статуса экскурсии с "На модерации" на "Подтверждена"
-- Использование: замените EXCURSION_ID на ID конкретной экскурсии

-- Для конкретной экскурсии по ID:
UPDATE excursions 
SET status = 'approved' 
WHERE excursion_id = EXCURSION_ID 
  AND status = 'pending_review';

-- Пример: изменить статус экскурсии с ID = 1
-- UPDATE excursions 
-- SET status = 'approved' 
-- WHERE excursion_id = 1 
--   AND status = 'pending_review';

-- Для выполнения внутри контейнера PostgreSQL:
-- docker compose exec db psql -U postgres -d fastapi -c "UPDATE excursions SET status = 'approved' WHERE excursion_id = EXCURSION_ID AND status = 'pending_review';"

-- Или через интерактивный режим psql:
-- docker compose exec db psql -U postgres -d fastapi
-- Затем выполните команду UPDATE выше
