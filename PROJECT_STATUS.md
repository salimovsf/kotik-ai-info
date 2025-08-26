# KOTIK AI - RAG-бот для туристов

## ⚠️ СТАТУС: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ - ПОЛНАЯ АРХИТЕКТУРА БД

**Дата:** 26 августа 2025  
**Приоритет:** КРИТИЧЕСКИЙ

### 🔧 **ИСПРАВЛЕНИЕ ВЫПОЛНЕНО:**
Первоначальная структура таблицы была **неполной** и не поддерживала ключевые возможности системы.

### ✅ **ИСПРАВЛЕННЫЕ ПРОБЛЕМЫ:**
1. **❌ Отсутствие типизации** → ✅ `card_type` + `entity_type` добавлены
2. **❌ Нет отслеживания источников** → ✅ `source_thread_ids` + `raw_data_payload`
3. **❌ Нет гибкости расширений** → ✅ `extra_data` для будущих функций
4. **❌ Нет управления процессом** → ✅ `batch_id`, `moderator_id`, `processing_version`

### 🎯 **НОВАЯ АРХИТЕКТУРА "ЕДИНЫЙ ЦЕНТР ЗНАНИЙ":**

#### **Поддерживаемые типы карточек:**
```sql
card_type CHECK (card_type IN ('chat_summary', 'entity_profile', 'live_data_provider'))
```

- **`chat_summary`** - саммари диалогов (основа)
- **`entity_profile`** - профили ресторанов/отелей/пляжей  
- **`live_data_provider`** - живые данные (будущее)

#### **Гибкость через entity_type:**
```javascript
// Примеры использования
{entity_type: 'restaurant'} // для ресторанов
{entity_type: 'hotel'}      // для отелей  
{entity_type: 'transport'}  // для транспорта
{entity_type: null}         // для общих статей
```

### 🛠️ **ПОЛНАЯ СТРУКТУРА ТАБЛИЦЫ (ВЕРСИЯ 2.4):**

```sql
CREATE TABLE public.golden_knowledge_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- География
  country text NOT NULL,
  city text NOT NULL,
  
  -- КЛЮЧЕВАЯ ТИПИЗАЦИЯ
  card_type text NOT NULL CHECK (card_type IN ('chat_summary', 'entity_profile', 'live_data_provider')),
  entity_type text,
  
  -- Контент
  title text NOT NULL,
  summary text,
  structured_data jsonb,
  links jsonb,
  tags text[],
  extra_data jsonb, -- ВОЛШЕБНАЯ ЯЧЕЙКА
  
  -- Управление
  status text NOT NULL DEFAULT 'draft',
  batch_id uuid,
  processing_version text,
  moderator_id uuid,
  
  -- Источники
  source_thread_ids text[], -- ОБЯЗАТЕЛЬНО!
  raw_data_payload jsonb,   -- ОБЯЗАТЕЛЬНО!
  
  -- Поиск
  vector vector(1536),
  
  -- Система
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 🚀 **ОБНОВЛЕННЫЙ ПЛАН ДЕЙСТВИЙ:**

#### **ПРИОРИТЕТ 1: СОЗДАНИЕ ПРАВИЛЬНОЙ БД**
- [ ] Выполнить **ПОЛНЫЙ SQL** из `GOLDEN_KNOWLEDGE_PLAN.md`
- [ ] Создать все индексы и триггеры
- [ ] Настроить RLS политики

#### **ПРИОРИТЕТ 2: ТИПИЗИРОВАННЫЙ СКРИПТ**
- [ ] Обновить `knowledge-base-compiler.js` с поддержкой типов
- [ ] Добавить обработку `source_thread_ids` и `raw_data_payload`
- [ ] Интегрировать `batch_id` для отслеживания

#### **ПРИОРИТЕТ 3: ТЕСТИРОВАНИЕ ТИПОВ**
- [ ] Создать тестовые записи всех типов
- [ ] Проверить поиск с фильтрацией по типам
- [ ] Валидировать структуру `extra_data`

### 🎯 **ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ ТИПИЗАЦИИ:**

#### **Chat Summary (основная масса):**
```javascript
{
  card_type: 'chat_summary',
  entity_type: null,
  title: 'Трансфер из Анталии в Каш - все способы',
  summary: 'Подробная статья...',
  source_thread_ids: ['thread_123', 'thread_456']
}
```

#### **Entity Profile (профили заведений):**
```javascript
{
  card_type: 'entity_profile', 
  entity_type: 'restaurant',
  title: 'Zaika Marina - индийский ресторан',
  structured_data: {
    phone: '+90 242 836 1234',
    cuisine: 'Indian',
    rating: 4.5
  }
}
```

#### **Live Data Provider (будущее):**
```javascript
{
  card_type: 'live_data_provider',
  entity_type: 'bus_schedule',
  extra_data: {
    api_endpoint: 'https://bus-api.com/schedule',
    refresh_interval: 3600
  }
}
```

### 🔮 **ПРЕИМУЩЕСТВА ИСПРАВЛЕННОЙ СИСТЕМЫ:**

✅ **Гибкость:** Одна таблица, множество типов контента  
✅ **Отслеживаемость:** Связь с источниками для переобработки  
✅ **Расширяемость:** `extra_data` для новых функций  
✅ **Управляемость:** Батчи, версии, модерация  
✅ **Масштабируемость:** География + типизация  

### 📅 **ОБНОВЛЕННЫЙ TIMELINE:**

**Неделя 1:** Создание полной БД + типизированный скрипт  
**Неделя 2:** Обработка топ-20 тем с разными типами  
**Неделя 3:** Векторизация + поиск по типам  
**Неделя 4:** Интеграция с ботом + продакшен  

### 🎯 **СЛЕДУЮЩИЕ ДЕЙСТВИЯ:**

**НЕМЕДЛЕННО:** Создать таблицу по **полной схеме 2.4**  
**ЗАТЕМ:** Обновить скрипт с поддержкой типизации  
**ПРОВЕРИТЬ:** Возможность отслеживания источников  

---

**🚨 КРИТИЧЕСКИ ВАЖНО:** Использовать только исправленную структуру БД! Базовая версия не подходит для полноценной системы.

**Статус:** ✅ ИСПРАВЛЕНО - Готов к реализации с полной архитектурой  
**Автор:** Claude Sonnet 4 + Салимов С.Ф.