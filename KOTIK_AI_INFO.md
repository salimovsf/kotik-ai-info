# 🤖 KOTIK AI - Революционный RAG-бот помощник

## 🔧 СТАТУС: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ - ПОЛНАЯ СТРУКТУРА "ЗОЛОТОЙ" БАЗЫ

**Последнее обновление:** 26 августа 2025, 15:40 UTC

### ⚠️ **ВАЖНОЕ ИСПРАВЛЕНИЕ:**
Первоначальный план содержал **неполную структуру таблицы**, которая не поддерживала ключевые возможности для гибкой системы.

### 🎯 **НОВАЯ СТРАТЕГИЯ (ИСПРАВЛЕННАЯ):**
Создание **"Единого Центра Знаний"** с поддержкой разных типов контента:
- **chat_summary** - саммари диалогов  
- **entity_profile** - профили ресторанов/отелей
- **live_data_provider** - живые данные (будущее)

### 🎉 **ДОСТИГНУТО (Этап 1):**
- ✅ **8,237 тредов** в сыром архиве (`Kotik_table`)
- ✅ **Анализ приоритетов:** Транспорт 29%, Жилье 22%, Еда 18%
- ✅ **AI Summary система** с GPT-4o-mini
- ✅ **Обнаружено:** 91.5% тредов без ответов = качественный контент

### 🔧 **ИСПРАВЛЕННАЯ АРХИТЕКТУРА:**

#### **1. Сырой Архив** (`Kotik_table`)
- 8,237 тредов с AI summaries
- Источник данных для создания золотых статей

#### **2. Золотая База Знаний** (`golden_knowledge_cards`) 
**ПОЛНАЯ СТРУКТУРА - ВЕРСИЯ 2.4:**

```sql
CREATE TABLE public.golden_knowledge_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- География
  country text NOT NULL,
  city text NOT NULL,

  -- КРИТИЧЕСКИ ВАЖНО: Типизация контента
  card_type text NOT NULL CHECK (card_type IN ('chat_summary', 'entity_profile', 'live_data_provider')),
  entity_type text, -- 'ресторан', 'отель', 'пляж', и т.д.

  -- Основной контент
  title text NOT NULL,
  summary text,
  structured_data jsonb,
  links jsonb,
  tags text[],
  
  -- ВОЛШЕБНАЯ ЯЧЕЙКА: для будущих расширений
  extra_data jsonb,

  -- Метаданные для управления
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'verified', 'needs_update', 'rejected')),
  batch_id uuid,
  processing_version text,
  moderator_id uuid,

  -- ОБЯЗАТЕЛЬНО: отслеживание источников
  source_thread_ids text[],
  raw_data_payload jsonb,

  -- Вектор для поиска
  vector vector(1536),

  -- Системные поля
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

#### **3. Векторный Поиск** (Pinecone + pgvector)
- Семантический поиск по золотым статьям
- Фильтрация по типам контента

### 🎯 **КЛЮЧЕВЫЕ ПРЕИМУЩЕСТВА ИСПРАВЛЕННОЙ СТРУКТУРЫ:**

#### **🔄 Гибкость системы:**
```javascript
// Саммари диалога
{
  card_type: 'chat_summary',
  title: 'Трансфер из Анталии в Каш - все способы'
}

// Профиль ресторана  
{
  card_type: 'entity_profile',
  entity_type: 'restaurant', 
  title: 'Zaika Marina - индийский ресторан'
}

// Живые данные (будущее)
{
  card_type: 'live_data_provider',
  entity_type: 'bus_schedule',
  extra_data: { api_endpoint: '...', refresh_interval: 3600 }
}
```

#### **📊 Отслеживание источников:**
```javascript
{
  source_thread_ids: ['thread_123', 'thread_456'],
  raw_data_payload: {
    original_threads: [...],
    ai_processing_params: {...},
    creation_timestamp: '2025-08-26T15:30:00Z'
  }
}
// Позволяет переобработать при улучшении AI-промптов
```

#### **🔮 Будущие расширения через `extra_data`:**
```javascript
{
  extra_data: {
    // Модерация
    confidence_score: 0.95,
    moderation_notes: 'Проверено экспертом',
    
    // Аналитика  
    views_count: 1250,
    usefulness_votes: 85,
    
    // AI метаданные
    processing_model: 'gpt-4o-mini'
  }
}
```

### 🛠️ **ОБНОВЛЕННЫЙ СКРИПТ "ГЛАВНЫЙ РЕДАКТОР":**

```javascript
// knowledge-base-compiler.js (с типизацией)
const PROCESSING_CONFIG = {
  batch_id: generateUUID(),
  processing_version: '1.0.0',
  
  topics: [
    {
      title: 'Трансфер из аэропорта Анталии в Каш',
      card_type: 'chat_summary',
      entity_type: null,
      keywords: ['анталия', 'аэропорт', 'трансфер']
    },
    {
      title: 'Zaika Marina',
      card_type: 'entity_profile', 
      entity_type: 'restaurant',
      keywords: ['zaika', 'marina', 'индийский']
    }
  ]
};
```

### 🎯 **ПРОМПТ "ГЛАВНОГО РЕДАКТОРА" (обновлен):**

```javascript
const CHIEF_EDITOR_PROMPT = `
Ты — главный редактор премиального туристического гида. 

ЗАДАЧА: Создать ${card_type === 'chat_summary' ? 'исчерпывающую статью' : 'детальный профиль сущности'} на основе диалогов.

СТРОГИЕ ПРАВИЛА:
1. ТОЛЬКО факты из диалогов
2. Структурированный формат
3. Точные цены, контакты, адреса

ФОРМАТ ОТВЕТА:
{
  "title": "Заголовок",
  "article_body": "Подробный контент", 
  "structured_data": {
    ${card_type === 'entity_profile' ? 
      '"entity_info": {"phone": "...", "address": "...", "rating": "..."}' :
      '"transport_info": {"prices": {...}, "schedule": {...}}'
    }
  },
  "links": [...],
  "tags": [...]
}
`;
```

### 📈 **ОБНОВЛЕННЫЕ СЛЕДУЮЩИЕ ЗАДАЧИ:**

1. ✅ **Создать полную таблицу** `golden_knowledge_cards` (версия 2.4)
2. 🔧 **Написать типизированный скрипт** `knowledge-base-compiler.js`
3. 📊 **Обработать топ-20 тем** с разными типами карточек
4. ⚡ **Создать эмбеддинги** с учетом типизации
5. 🤖 **Интеграция с ботом** с фильтрацией по типам

### 🎯 **КРИТЕРИИ УСПЕХА (обновлены):**
- **3 типа карточек** поддерживаются системой
- **100% источников** отслеживаются для переобработки  
- **Любые расширения** добавляются через `extra_data`
- **<2 сек** поиск с фильтрацией по типам

---

### 🚀 **КАК ЗАПУСТИТЬ (ОБНОВЛЕННЫЙ WORKFLOW):**

```bash
# 1. Создать полную таблицу (Supabase SQL Editor)
# Использовать SQL из GOLDEN_KNOWLEDGE_PLAN.md

# 2. Компиляция с типизацией
node knowledge-base-compiler.js --type=chat_summary
node knowledge-base-compiler.js --type=entity_profile

# 3. Векторизация по типам
node optimized-embedding-creator.js --filter-by-type

# 4. Тест поиска с фильтрацией
node test-golden-search.js --entity-type=restaurant
```

**🎯 Цель: Создать гибкую систему "Единого Центра Знаний", готовую к любым будущим расширениям без изменения структуры БД!** 🏖️🤖

---

**Статус:** ✅ ИСПРАВЛЕНО - Полная архитектура готова к реализации  
**Приоритет:** КРИТИЧЕСКИЙ - Использовать только исправленную структуру