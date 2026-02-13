// --- 1. МОК-ДАННЫЕ ---
const mockExcursions = [
    {
      id: 101,
      city: 'Москва',
      title: 'Измайловский кремль — сказка и быль',
      duration: '3 часа',
      price: 6500,
      description: 'Увидеть намного больше, чем яркий новодел, перенестись в 17 век и ощутить дух творчества',
      rating: 9.8,
      guide: 'Иван Петров'
    },
    {
      id: 102,
      city: 'Москва',
      title: 'Московское метро: подземные дворцы',
      duration: '2 часа',
      price: 2100,
      description: 'Экскурсия по самым красивым станциям Московского метрополитена, памятникам архитектуры.',
      rating: 4.9,
      guide: 'Мария Семенова'
    },
    {
      id: 201,
      city: 'Санкт-Петербург',
      title: 'Парадный Петербург: Нева и Дворцовая',
      duration: '4 часа',
      price: 4200,
      description: 'Классический маршрут по сердцу Северной столицы, включая Зимний дворец и Стрелку Васильевского острова.',
      rating: 4.7,
      guide: 'Алексей Иванов'
    },
    {
      id: 202,
      city: 'Санкт-Петербург',
      title: 'Мистический Петербург Достоевского',
      duration: '3.5 часа',
      price: 3800,
      description: 'Прогулка по мрачным и таинственным переулкам, вдохновившим великого писателя.',
      rating: 4.6,
      guide: 'Елена Ковалева'
    },
  ];
  
  // --- 2. ФУНКЦИИ API С ИМИТАЦИЕЙ ЗАДЕРЖКИ (1 секунда) ---
  
  /**
   * Имитирует запрос на поиск экскурсий.
   * Фильтрует по городу.
   * @param {object} params - Параметры поиска, включая city и persons.
   * @returns {Promise<Array>} Отфильтрованный список экскурсий.
   */
  export const fetchExcursions = (params) => {
      return new Promise(resolve => {
          // Имитируем задержку сети
          setTimeout(() => {
              if (!params.city) {
                  // Если город не указан, возвращаем все
                  resolve(mockExcursions);
                  return;
              }
              
              // Фильтрация по городу (регистронезависимая)
              const filtered = mockExcursions.filter(ex => 
                  ex.city.toLowerCase() === params.city.toLowerCase()
              );
  
              // Если результатов нет, можно вернуть пустой массив
              resolve(filtered);
  
          }, 1000); 
      });
  };
  
  /**
   * Имитирует запрос на получение деталей одной экскурсии по ID.
   * @param {number|string} id - ID экскурсии.
   * @returns {Promise<object|null>} Объект экскурсии или null, если не найдена.
   */
  export const getExcursionById = (id) => {
      return new Promise(resolve => {
          // Имитируем задержку сети
          setTimeout(() => {
              // Ищем экскурсию. Важно преобразовать id к одному типу (например, Number)
              const excursion = mockExcursions.find(ex => ex.id === Number(id));
              resolve(excursion || null);
          }, 800);
      });
  };