import { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { 
  getTelegramUser, 
  upsertTelegramUser, 
  saveConversation, 
  getUserConversations,
  logError,
  updateBotStats 
} from './db';
import { logger } from './logging';

// ================= CONFIG =================
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ================= GLOBALS =================
const userContext: Map<number, any[]> = new Map();
const userRequests: Map<number, number> = new Map();
const requestQueue: any[] = [];
let botInstance: Telegraf<Context> | null = null;

// ================= RATE LIMITING =================
function isRateLimited(userId: number): boolean {
  const now = Date.now() / 1000;
  if (userRequests.has(userId)) {
    const lastRequest = userRequests.get(userId) || 0;
    if (now - lastRequest < 2) {
      return true;
    }
  }
  userRequests.set(userId, now);
  return false;
}

// ================= MEMORY MANAGEMENT =================
function smartMemory(history: any[]): any[] {
  // Keep last 6 messages for context
  return history.slice(-6);
}

// ================= WEB SEARCH =================
async function webSearch(query: string): Promise<string> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;
    // const response = await httpSession.get(url)
    // const data = await response.json()
    // return data.get('AbstractText', '')
    return '';
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('[Search] Error:', err);
    return '';
  }
}

// ================= AI RESPONSE =================
async function getAiResponse(
  text: string,
  userId: number,
  username: string,
  systemOverride?: string
): Promise<string> {
  try {
    const history = userContext.get(userId) || [];
    const isEnglish = /[a-zA-Z]/.test(text.substring(0, 20));

    // Get search results
    const searchResult = await webSearch(text);
    let enrichedText = text;
    if (searchResult) {
      enrichedText += `\n\n[Search Result]: ${searchResult}`;
    }

    const systemPrompt = systemOverride || `
أنت "مراد"، مساعد ذكي جداً.
- رد بنفس لغة المستخدم
- كن مختصراً ومفيداً
- التاريخ الحالي: ${new Date().toISOString().split('T')[0]}
`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...smartMemory(history),
      { role: 'user', content: enrichedText }
    ];

    const headers = {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip, deflate'
    };

    const payload = {
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 700
    };

    const startTime = Date.now();

    // Make API request to Groq
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'لم أتمكن من الرد على رسالتك.';
    const responseTime = Date.now() - startTime;

    // Save to database
    await saveConversation({
      telegramUserId: userId,
      role: 'user',
      content: text,
      tokens: 0,
      responseTime: 0,
      createdAt: new Date()
    });

    await saveConversation({
      telegramUserId: userId,
      role: 'assistant',
      content: reply,
      tokens: 0,
      responseTime,
      createdAt: new Date()
    });

    // Update context
    history.push({ role: 'user', content: text });
    history.push({ role: 'assistant', content: reply });
    userContext.set(userId, history.slice(-10));

    logger.info(`[AI] Response generated in ${responseTime}ms for user ${userId}`);
    return reply;

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('[AI] Error:', err);
    await logError({
      telegramUserId: userId,
      errorType: 'AI_RESPONSE_ERROR',
      errorMessage: err.message,
      stackTrace: err.stack,
      context: JSON.stringify({ text }),
      resolved: 0,
      createdAt: new Date()
    });
    return '⚠️ حصل خطأ في معالجة رسالتك. حاول مرة أخرى.';
  }
}

// ================= MESSAGE HANDLER =================
async function handleMessage(ctx: Context) {
  try {
    if (!ctx.message || !('text' in ctx.message)) {
      return;
    }

    const userId = ctx.from?.id || 0;
    const username = ctx.from?.first_name || 'User';
    const text = ctx.message.text;

    // Check rate limit
    if (isRateLimited(userId)) {
      await ctx.reply('استنى ثانية بس 🙏');
      return;
    }

    // Update user in database
    await upsertTelegramUser({
      userId,
      username: ctx.from?.username,
      firstName: ctx.from?.first_name,
      lastName: ctx.from?.last_name,
      languageCode: ctx.from?.language_code,
      isPremium: ctx.from?.is_premium ? 1 : 0,
      lastMessageAt: new Date()
    });

    // Send loading message
    const loadingMsg = await ctx.reply('⏳ بفكر...');

    // Get AI response
    const response = await getAiResponse(text, userId, username);

    // Edit message instead of sending new one
    await ctx.telegram.editMessageText(
      userId,
      loadingMsg.message_id,
      undefined,
      response
    );

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('[Handler] Error:', err);
    await logError({
      telegramUserId: ctx.from?.id,
      errorType: 'MESSAGE_HANDLER_ERROR',
      errorMessage: err.message,
      stackTrace: err.stack,
      context: JSON.stringify({ message: ctx.message }),
      resolved: 0,
      createdAt: new Date()
    });
    await ctx.reply('⚠️ حصل خطأ. حاول مرة أخرى.');
  }
}

// ================= VOICE HANDLER =================
async function handleVoice(ctx: Context) {
  try {
    if (!ctx.message || !('voice' in ctx.message)) {
      return;
    }

    const userId = ctx.from?.id || 0;
    const username = ctx.from?.first_name || 'User';

    await ctx.reply('🎤 بفهم كلامك...');

    // TODO: Implement voice transcription and response
    // For now, just acknowledge
    await ctx.reply('ميزة الصوت قريباً 🎵');

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('[Voice] Error:', err);
    await ctx.reply('⚠️ حصل خطأ في معالجة الصوت.');
  }
}

// ================= KEEP ALIVE =================
async function keepAlive() {
  while (true) {
    try {
      // Keep the bot alive by making periodic requests
      logger.debug('[KeepAlive] Ping sent');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('[KeepAlive] Error:', err);
    }
    // Sleep for 5 minutes
    await new Promise(resolve => setTimeout(resolve, 300000));
  }
}

// ================= BOT INITIALIZATION =================
export async function initBot() {
  try {
    botInstance = new Telegraf(TELEGRAM_TOKEN);

    // Register handlers
    botInstance.on(message('text'), handleMessage);
    botInstance.on(message('voice'), handleVoice);

    // Start keep-alive loop
    keepAlive().catch(error => {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('[KeepAlive] Fatal error:', err);
    });

    logger.info('[Bot] Telegram bot initialized');
    return botInstance;

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('[Bot] Initialization error:', err);
    throw err;
  }
}

// ================= BOT START =================
export async function startBot() {
  try {
    if (!botInstance) {
      await initBot();
    }

    if (botInstance) {
      await botInstance.launch();
      logger.info('[Bot] 🚀 Murad AI Bot is running...');
    }

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('[Bot] Start error:', err);
    throw err;
  }
}

// ================= BOT STOP =================
export async function stopBot() {
  try {
    if (botInstance) {
      await botInstance.stop();
      logger.info('[Bot] Bot stopped');
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('[Bot] Stop error:', err);
  }
}

// ================= STATS =================
export function getBotStats() {
  return {
    activeUsers: userContext.size,
    queueLength: requestQueue.length,
    uptime: process.uptime()
  };
}
