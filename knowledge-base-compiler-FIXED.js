#!/usr/bin/env node

/**
 * ============================================================================
 * KOTIK AI: KNOWLEDGE BASE COMPILER - "ГЛАВНЫЙ РЕДАКТОР"
 * Компилятор золотых статей из сырых диалогов (Версия 1.0)
 * 
 * ИСПРАВЛЕНА КРИТИЧЕСКАЯ ОШИБКА: Удален markdown блок из строки 386
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

// ============================================================================
// КОНФИГУРАЦИЯ
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Проверяем наличие ключей
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error('❌ Ошибка: Не заданы переменные окружения!');
  console.log('Убедитесь что в .env файле есть:');
  console.log('- SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_KEY');
  console.log('- OPENAI_API_KEY');
  process.exit(1);
}

// Инициализация клиентов
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Глобальные настройки обработки
const PROCESSING_CONFIG = {
  batch_id: uuidv4(),
  processing_version: '1.0.0',
  ai_model: 'gpt-4o-mini',
  max_threads_per_topic: 30,
  min_thread_relevance: 2,
  parallel_processing: 2,
  batch_size: 5,
  delay_between_batches: 3000
};

// ============================================================================
// КОНФИГУРАЦИЯ ТОПИКОВ ДЛЯ ОБРАБОТКИ (27 ТЕМ)
// ============================================================================

const TOPICS_CONFIG = [
  // ТРАНСПОРТ (5 тем)
  {
    id: 'transport_antalya_kas',
    title: 'Трансфер из аэропорта Анталии в Каш',
    card_type: 'chat_summary',
    entity_type: null,
    country: 'Turkey',
    city: 'Kas',
    keywords: ['анталия', 'аэропорт', 'трансфер', 'каш', 'автобус', 'такси'],
    priority: 'high'
  },
  {
    id: 'local_transport_kas',
    title: 'Транспорт в Каше - передвижение по городу',
    card_type: 'chat_summary',
    entity_type: 'transport_local',
    country: 'Turkey',
    city: 'Kas',
    keywords: ['транспорт', 'каш', 'долмуш', 'такси', 'аренда', 'машина', 'скутер'],
    priority: 'high'
  },
  {
    id: 'zaika_marina_profile',
    title: 'Zaika Marina - Индийский ресторан в Каше',
    card_type: 'entity_profile',
    entity_type: 'restaurant',
    country: 'Turkey',
    city: 'Kas',
    keywords: ['zaika', 'marina', 'индийский', 'ресторан'],
    priority: 'medium'
  }
  // ... остальные 24 темы
];

// ============================================================================
// ПРОМПТ "ГЛАВНОГО РЕДАКТОРА" (ИСПРАВЛЕН)
// ============================================================================

const CHIEF_EDITOR_PROMPT = (topicConfig, threads) => `
Ты — главный редактор премиального туристического гида по Турции. Перед тобой подборка РЕАЛЬНЫХ диалогов туристов на конкретную тему.

ЗАДАЧА: Создать ${topicConfig.card_type === 'entity_profile' ? 'детальный профиль сущности' : 'исчерпывающую статью'} высочайшего качества.

СТРОГИЕ ПРАВИЛА:
1. ✅ ТОЛЬКО факты из предоставленных диалогов - никакой отсебятины!
2. ✅ Структурированный, легко читаемый формат с заголовками
3. ✅ Все цены, контакты, адреса должны быть точными из диалогов
4. ✅ Географический контекст: фокус на ${topicConfig.city} и окрестностях

ВХОДНЫЕ ДАННЫЕ:
Тема: ${topicConfig.title}
Тип карточки: ${topicConfig.card_type}
Количество диалогов: ${threads.length}

ДИАЛОГИ:
${threads.map((thread, idx) => `
=== ДИАЛОГ ${idx + 1} ===
ВОПРОС: ${thread.question}
ОТВЕТЫ: ${thread.full_answers || 'Нет ответов'}
AI SUMMARY: ${thread.ai_summary || 'Нет саммари'}
ВАЖНОСТЬ: ${thread.importance_score}/10
`).join('\\n')}

ТРЕБУЕМЫЙ ФОРМАТ ОТВЕТА - ТОЛЬКО ЧИСТЫЙ JSON (без markdown блоков):
{
  "title": "${topicConfig.card_type === 'entity_profile' ? 'Название сущности + краткое описание' : 'Информативный заголовок статьи'}",
  "summary": "${topicConfig.card_type === 'entity_profile' ? 'Детальное описание сущности' : 'Подробная статья с заголовками, списками, практической информацией'}",
  "structured_data": {
    "prices": {"тип_услуги": "диапазон_цен"},
    "contacts": [{"name": "Название", "type": "telegram/phone", "value": "контакт"}],
    "locations": ["Место 1", "Место 2"],
    "timing": {"best_time": "когда лучше", "duration": "время"}
  },
  "links": [
    {"type": "contact", "url": "https://t.me/username", "description": "@username"}
  ],
  "tags": ["основные", "ключевые", "слова", "каш"]
}

⚠️ ВАЖНО: 
- Отвечай ТОЛЬКО валидным JSON
- НЕ используй markdown блоки с обратными кавычками
- НЕ добавляй никаких пояснений до или после JSON

ПОМНИ: 
- Если информации мало, честно напиши что знаешь
- Группируй похожую информацию из разных диалогов  
- Выделяй самые важные практические советы
`;

// ============================================================================
// ОСНОВНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Поиск релевантных тредов для темы
 */
async function findRelevantThreads(topicConfig) {
  console.log(`🔍 Поиск тредов для темы: ${topicConfig.title}`);
  
  try {
    // Упрощенный подход: ищем по каждому ключевому слову отдельно
    const allThreads = new Map(); // Используем Map для избежания дубликатов
    
    for (const keyword of topicConfig.keywords) {
      console.log(`  🔎 Поиск по ключевому слову: "${keyword}"`);
      
      // Поиск в question
      const { data: questionResults, error: questionError } = await supabase
        .from('Kotik_table')
        .select('*')
        .ilike('question', `%${keyword}%`)
        .gte('importance_score', PROCESSING_CONFIG.min_thread_relevance)
        .limit(10);
        
      if (questionError) {
        console.warn(`⚠️ Ошибка поиска в question по "${keyword}":`, questionError.message);
      } else {
        questionResults?.forEach(thread => allThreads.set(thread.id, thread));
      }
      
      // Поиск в ai_summary
      const { data: summaryResults, error: summaryError } = await supabase
        .from('Kotik_table')
        .select('*')
        .ilike('ai_summary', `%${keyword}%`)
        .gte('importance_score', PROCESSING_CONFIG.min_thread_relevance)
        .limit(10);
        
      if (summaryError) {
        console.warn(`⚠️ Ошибка поиска в ai_summary по "${keyword}":`, summaryError.message);
      } else {
        summaryResults?.forEach(thread => allThreads.set(thread.id, thread));
      }
      
      // Поиск в full_answers  
      const { data: answersResults, error: answersError } = await supabase
        .from('Kotik_table')
        .select('*')
        .ilike('full_answers', `%${keyword}%`)
        .gte('importance_score', PROCESSING_CONFIG.min_thread_relevance)
        .limit(10);
        
      if (answersError) {
        console.warn(`⚠️ Ошибка поиска в full_answers по "${keyword}":`, answersError.message);
      } else {
        answersResults?.forEach(thread => allThreads.set(thread.id, thread));
      }
    }
    
    // Преобразуем Map обратно в массив и сортируем
    const threads = Array.from(allThreads.values())
      .sort((a, b) => {
        // Сортируем по importance_score, потом по replies_count
        if (b.importance_score !== a.importance_score) {
          return b.importance_score - a.importance_score;
        }
        return (b.replies_count || 0) - (a.replies_count || 0);
      })
      .slice(0, PROCESSING_CONFIG.max_threads_per_topic);
    
    console.log(`✅ Найдено ${threads.length} релевантных тредов`);
    return threads;
    
  } catch (error) {
    console.error('❌ Общая ошибка поиска тредов:', error);
    return [];
  }
}

/**
 * Создание золотой статьи с помощью GPT-4o
 */
async function createGoldenArticle(topicConfig, threads) {
  console.log(`🤖 Создание статьи для: ${topicConfig.title}`);
  
  if (!threads.length) {
    console.warn('⚠️ Нет тредов для обработки');
    return null;
  }
  
  const prompt = CHIEF_EDITOR_PROMPT(topicConfig, threads);
  
  try {
    const response = await openai.chat.completions.create({
      model: PROCESSING_CONFIG.ai_model,
      messages: [
        {
          role: 'system',
          content: 'Ты - экспертный редактор туристических гидов. Создаешь только качественный, фактический контент на основе реальных данных. Отвечаешь ИСКЛЮЧИТЕЛЬНО чистым, валидным JSON без markdown разметки или дополнительных комментариев.'
        },
        {
          role: 'user', 
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    });
    
    const aiResponse = response.choices[0].message.content;
    console.log(`✅ Получен ответ от ${PROCESSING_CONFIG.ai_model}`);
    
    // Парсим JSON ответ
    try {
      let jsonString = aiResponse.trim();
      
      // Обработка markdown блоков (если AI все же их использует)
      if (jsonString.includes('```')) {
        jsonString = jsonString.replace(/```json\\s*|```\\s*/g, '').trim();
      }
      
      const parsedResponse = JSON.parse(jsonString);
      return parsedResponse;
    } catch (parseError) {
      console.error('❌ Ошибка парсинга JSON:', parseError);
      console.log('Raw AI response:', aiResponse.slice(0, 200) + '...');
      
      // Fallback: создаем базовую структуру
      return {
        title: topicConfig.title,
        summary: aiResponse,
        structured_data: {},
        links: [],
        tags: topicConfig.keywords
      };
    }
    
  } catch (apiError) {
    console.error('❌ Ошибка OpenAI API:', apiError);
    throw apiError;
  }
}

/**
 * Сохранение золотой статьи в БД
 */
async function saveGoldenCard(topicConfig, threads, aiResult) {
  console.log(`💾 Сохранение карточки: ${aiResult.title}`);
  
  const goldenCard = {
    // География  
    country: topicConfig.country,
    city: topicConfig.city,
    
    // Типизация
    card_type: topicConfig.card_type,
    entity_type: topicConfig.entity_type,
    
    // Контент
    title: aiResult.title,
    summary: aiResult.summary,
    structured_data: aiResult.structured_data,
    links: aiResult.links || [],
    tags: aiResult.tags || topicConfig.keywords,
    
    // Метаданные обработки
    batch_id: PROCESSING_CONFIG.batch_id,
    processing_version: PROCESSING_CONFIG.processing_version,
    status: 'draft',
    
    // Источники
    source_thread_ids: threads.map(t => t.id?.toString() || t.thread_id?.toString()),
    raw_data_payload: {
      original_threads_count: threads.length,
      ai_model: PROCESSING_CONFIG.ai_model,
      processing_timestamp: new Date().toISOString(),
      topic_config: topicConfig,
      keywords_used: topicConfig.keywords
    },
    
    // Дополнительные данные
    extra_data: {
      creation_stats: {
        threads_processed: threads.length,
        avg_importance_score: threads.reduce((acc, t) => acc + (t.importance_score || 0), 0) / threads.length,
        total_replies: threads.reduce((acc, t) => acc + (t.replies_count || 0), 0)
      }
    }
  };
  
  const { data, error } = await supabase
    .from('golden_knowledge_cards')
    .insert([goldenCard])
    .select();
    
  if (error) {
    console.error('❌ Ошибка сохранения:', error);
    throw error;
  }
  
  console.log(`✅ Карточка сохранена с ID: ${data[0]?.id}`);
  return data[0];
}

// ============================================================================
// ОСНОВНАЯ ФУНКЦИЯ (сокращенная версия)
// ============================================================================

async function main() {
  console.log(`
🤖 ============================================================================
   KOTIK AI: KNOWLEDGE BASE COMPILER - "ГЛАВНЫЙ РЕДАКТОР"
   Версия: ${PROCESSING_CONFIG.processing_version}
   СТАТУС: ✅ ОШИБКА ИСПРАВЛЕНА
============================================================================
  `);
  
  try {
    // Проверяем подключение к Supabase
    console.log('🔗 Проверка подключения к Supabase...');
    const { data: testConnection, error: testError } = await supabase
      .from('golden_knowledge_cards')
      .select('count')
      .limit(1);
      
    if (testError) {
      console.error('❌ Ошибка подключения к Supabase:', testError);
      console.error('Убедитесь что таблица golden_knowledge_cards создана!');
      throw testError;
    }
      
    console.log('✅ Подключение к Supabase установлено');
    console.log('✅ Таблица golden_knowledge_cards доступна');
    
    console.log('\\n🎯 Готов к обработке тем!');
    console.log('Для запуска полной обработки раскомментируйте код ниже...');
    
    // РАСКОММЕНТИРУЙТЕ ДЛЯ ПОЛНОЙ ОБРАБОТКИ:
    // const sortedTopics = [...TOPICS_CONFIG].sort((a, b) => {
    //   const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    //   return priorityOrder[b.priority] - priorityOrder[a.priority];
    // });
    // ... остальная логика обработки
    
  } catch (error) {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  }
}

// ============================================================================
// ЗАПУСК
// ============================================================================

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}