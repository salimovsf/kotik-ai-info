# 🗃️ SQL СКРИПТ ДЛЯ СОЗДАНИЯ GOLDEN KNOWLEDGE CARDS

**Файл:** `create-golden-knowledge-table.sql`  
**Назначение:** Создание полной структуры "золотой" базы знаний  
**Статус:** ✅ ГОТОВ К ВЫПОЛНЕНИЮ

## 🏗️ ПОЛНАЯ СТРУКТУРА ТАБЛИЦЫ (ВЕРСИЯ 2.4)

```sql
-- Создаем "золотую" таблицу, готовую к автоматизации и будущим расширениям
CREATE TABLE public.golden_knowledge_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- География
  country text NOT NULL,
  city text NOT NULL,

  -- Типизация контента (КРИТИЧЕСКИ ВАЖНО!)
  card_type text NOT NULL CHECK (card_type IN ('chat_summary', 'entity_profile', 'live_data_provider')),
  entity_type text, -- 'ресторан', 'отель', 'пляж', и т.д.

  -- Основной контент
  title text NOT NULL,
  summary text, -- Можешь переименовать в article_body, если хочешь
  structured_data jsonb,
  links jsonb,
  tags text[],
  
  -- Поле для будущих расширений (ВОЛШЕБНАЯ ЯЧЕЙКА!)
  extra_data jsonb,

  -- Метаданные для управления и автоматизации
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'verified', 'needs_update', 'rejected')),
  batch_id uuid,
  processing_version text,
  moderator_id uuid,

  -- Данные для отслеживания источника (ОБЯЗАТЕЛЬНО!)
  source_thread_ids text[],
  raw_data_payload jsonb,

  -- Вектор для поиска
  vector vector(1536),

  -- Системные поля
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_golden_cards_geography ON public.golden_knowledge_cards (country, city);
CREATE INDEX idx_golden_cards_type ON public.golden_knowledge_cards (card_type, entity_type);
CREATE INDEX idx_golden_cards_status ON public.golden_knowledge_cards (status);
CREATE INDEX idx_golden_cards_tags ON public.golden_knowledge_cards USING GIN (tags);
CREATE INDEX idx_golden_cards_batch ON public.golden_knowledge_cards (batch_id);
CREATE INDEX idx_golden_cards_vector ON public.golden_knowledge_cards USING ivfflat (vector) WITH (lists = 100);

-- Автоматическое обновление updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_golden_cards_updated_at 
    BEFORE UPDATE ON public.golden_knowledge_cards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS политики (если нужны)
ALTER TABLE public.golden_knowledge_cards ENABLE ROW LEVEL SECURITY;

-- Политика для чтения (публичная)
CREATE POLICY "Golden cards are readable by everyone" ON public.golden_knowledge_cards
    FOR SELECT USING (true);

-- Политика для записи (только для авторизованных)
CREATE POLICY "Golden cards are writable by authenticated users" ON public.golden_knowledge_cards
    FOR ALL USING (auth.role() = 'authenticated');
```

## 🧪 ТЕСТОВЫЕ ДАННЫЕ

```sql
-- Тестовая вставка для проверки структуры
INSERT INTO public.golden_knowledge_cards (
  country, city, card_type, entity_type, title, summary, 
  structured_data, links, tags, 
  source_thread_ids, raw_data_payload
) VALUES (
  'Turkey', 'Kas', 'chat_summary', null,
  'Трансфер из аэропорта Анталии в Каш - все способы',
  'Подробная статья о всех способах добраться из аэропорта Анталии в Каш...',
  '{"transport_options": {"bus": {"price": "50 TL", "duration": "4 hours"}, "taxi": {"price": "800-1000 TL", "duration": "3 hours"}}}',
  '{"maps": ["https://maps.google.com/..."], "bookings": ["https://booking.com/..."]}',
  ARRAY['транспорт', 'аэропорт', 'анталия', 'каш'],
  ARRAY['thread_001', 'thread_002'],
  '{"processing_timestamp": "2025-08-26T16:00:00Z", "ai_model": "gpt-4o-mini"}'
),
(
  'Turkey', 'Kas', 'entity_profile', 'restaurant',
  'Zaika Marina - индийский ресторан в Каше',
  'Популярный индийский ресторан с видом на марину...',
  '{"entity_info": {"phone": "+90 242 836 1234", "cuisine": "Indian", "rating": 4.5, "location": "Marina area"}}',
  '{"social": ["@zaika_kas"], "maps": ["https://maps.google.com/zaika"]}',
  ARRAY['ресторан', 'индийская кухня', 'марина'],
  ARRAY['thread_100'],
  '{"processing_timestamp": "2025-08-26T16:00:00Z", "entity_extraction": true}'
);
```

## 🔍 ЗАПРОСЫ ДЛЯ ПРОВЕРКИ

```sql
-- Проверить создание таблицы
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'golden_knowledge_cards'
ORDER BY ordinal_position;

-- Проверить индексы
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'golden_knowledge_cards';

-- Проверить тестовые данные
SELECT 
  card_type, 
  entity_type, 
  title, 
  array_length(source_thread_ids, 1) as source_count,
  created_at
FROM golden_knowledge_cards;

-- Проверить типизацию
SELECT 
  card_type,
  entity_type,
  COUNT(*) as count
FROM golden_knowledge_cards 
GROUP BY card_type, entity_type;
```

## 🎯 СЛЕДУЮЩИЕ ШАГИ ПОСЛЕ СОЗДАНИЯ ТАБЛИЦЫ

1. **Исправить knowledge-base-compiler.js** (убрать markdown блок из строки 386)
2. **Протестировать скрипт компиляции** 
3. **Создать первые золотые карточки**
4. **Добавить векторизацию**

---

**Выполнить в Supabase SQL Editor:** Скопировать и выполнить SQL выше  
**Статус:** ✅ ГОТОВ К СОЗДАНИЮ  
**Автор:** Claude Sonnet 4