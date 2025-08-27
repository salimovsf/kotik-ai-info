# СЕССИЯ: MVP БАЗА ЗНАНИЙ - СОЗДАНИЕ И ЗАГРУЗКА ДАННЫХ

**Дата:** 27 августа 2025  
**Задача:** Создание PostgreSQL схемы и загрузка обработанных данных ресторанов

## 🎯 **ВЫПОЛНЕННЫЕ ЗАДАНИЯ:**

### ✅ **Задача №1: SQL Схема База Данных**
- **Создан:** `schema.sql` с тремя основными таблицами
- **Архитектура:** MVP подход с гибкой структурой
- **Расширения:** PostGIS для геолокации, JSONB для гибких данных

### ✅ **Задача №2: Python Скрипт Загрузки**  
- **Создан:** `load_to_db.py` с UPSERT операциями
- **Функции:** Безопасная загрузка, обработка отзывов, версионирование
- **Обработка:** Парсинг дат, извлечение тегов, подготовка JSONB

## 🗄️ **СТРУКТУРА БАЗЫ ДАННЫХ MVP:**

### **1. Таблица `entities` (Основная)**
```sql
- id (SERIAL PRIMARY KEY)
- google_place_id (UNIQUE) -- Для дедупликации
- entity_type ('restaurant', 'hotel', 'guide')
- title, address, location (PostGIS Geography)
- contacts (JSONB) -- phone, website, whatsapp_link
- rating_overall, reviews_count
- details (JSONB) -- "Магическая ячейка" для специфических данных
- summary_main (AI описание ~1000 символов)
- summary_reviews (AI саммари отзывов)
- tags (TEXT[]) -- для поиска
- version, created_at, updated_at
```

### **2. Таблица `reviews`**
```sql
- id, entity_id (FK)
- review_text, rating (1-5)
- review_date, original_language
- review_context (JSONB)
- source ('google')
```

### **3. Таблица `entity_connections`**
```sql  
- id, entity_from_id (FK), entity_to_id (FK)
- connection_type ('nearby', 'mentioned_in', 'similar')
- connection_strength (0.00-1.00)
- created_at
```

## 🚀 **ГОТОВЫЕ СКРИПТЫ:**

### **schema.sql**
- ✅ Создание всех таблиц
- ✅ PostGIS расширение
- ✅ Индексы для производительности
- ✅ Комментарии и ограничения

### **load_to_db.py**
- ✅ Подключение к Supabase PostgreSQL
- ✅ Чтение `restaurants_final_structured_extended.json`
- ✅ UPSERT операции с версионированием
- ✅ Batch обработка для надежности
- ✅ Обработка ошибок и логирование

## 📊 **ДАННЫЕ ДЛЯ ЗАГРУЗКИ:**

### **Источник:** `restaurants_final_structured_extended.json`
- **Ресторанов:** 5 заведений из Каша
- **AI описания:** ~1000 символов (результат эксперимента)
- **Отзывы:** ~30 отзывов на ресторан (~150 всего)
- **Структура:** Полная с координатами, контактами, деталями

### **Что загружается в entities:**
```json
{
  "google_place_id": "ChIJf9T_x-fbwRQRCVOKzn1MM_Q",
  "entity_type": "restaurant", 
  "title": "Kaya Koruğu",
  "location": "POINT(29.6422481 36.1991868)",
  "contacts": {"phone": "+90 532 131 20 57", "website": "..."},
  "details": {"opening_hours": [...], "price_category": "1 000 ₺+"},
  "summary_main": "Средняя оценка — 4.7. В отзывах часто упоминают...",
  "tags": ["Ресторан", "1 000 ₺+", "лосось", "осьминог"]
}
```

### **Что загружается в reviews:**
```json
{
  "entity_id": 1,
  "review_text": "Herşeyiyle harika bir akşam geçirdik...",
  "rating": 5,
  "review_date": "2025-08-25",
  "original_language": "tr",
  "review_context": {"Цена на человека": "2 000 ₺+"}
}
```

## 🎯 **КЛЮЧЕВЫЕ ОСОБЕННОСТИ РЕАЛИЗАЦИИ:**

### **UPSERT Логика:**
```sql
INSERT INTO entities (...)
VALUES (...)
ON CONFLICT (google_place_id)
DO UPDATE SET
    version = entities.version + 1,
    updated_at = NOW()
RETURNING id;
```

### **Обработка Отзывов:**
1. Удаляем старые отзывы для entity_id
2. Вставляем свежие отзывы из prepared_reviews
3. Парсим относительные даты ("3 дня назад" → DATE)

### **Извлечение Тегов:**
- Категории из Google Maps
- Ценовая категория  
- Ключевые слова из AI описания
- Упоминания блюд и особенностей

### **Batch Обработка:**
- Обработка по 10 записей за раз
- Rollback при ошибках в batch
- Подробная статистика по каждому batch

## 🔧 **НАСТРОЙКА ПОДКЛЮЧЕНИЯ:**

### **Supabase PostgreSQL:**
```python
DATABASE_CONFIG = {
    'host': 'aws-0-eu-central-1.pooler.supabase.com',
    'port': '6543', 
    'database': 'postgres',
    'user': 'postgres.pqvdqkcamyutgazskeky',
    'password': 'Kotik_database_2025!'
}
```

### **Требования:**
```bash
pip install psycopg2-binary python-dateutil
```

## 📈 **СЛЕДУЮЩИЕ ЭТАПЫ:**

### **После успешной загрузки:**
1. ✅ **Создание эмбедингов** через OpenAI API
2. ✅ **Настройка векторного поиска** (pgvector или Pinecone)
3. ✅ **Автоматические связи** между сущностями
4. ✅ **Интеграция с Telegram ботом**

### **Расширение данных:**
- Добавление отелей, beach clubs
- Загрузка гайдов по Кашу
- Создание entity_connections

## 💰 **РЕСУРСЫ И КЛЮЧИ:**

### **Готовые API ключи:**
- ✅ Supabase (anon + service_role)
- ✅ OpenAI для эмбедингов
- ✅ Pinecone для векторной БД

### **Использованные данные:**
- ✅ 5 ресторанов с расширенными саммари
- ✅ ~150 обработанных отзывов
- ✅ Полная структура для MVP

---

**🎯 РЕЗУЛЬТАТ:** MVP база знаний готова к наполнению и интеграции с поисковой системой!

*Создано с использованием Claude Sonnet 4*  
*Принцип: "От данных к рабочей системе"*
