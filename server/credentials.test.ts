import { describe, it, expect } from 'vitest';

describe('Credentials Validation', () => {
  it('should have TELEGRAM_TOKEN set', () => {
    const token = process.env.TELEGRAM_TOKEN;
    expect(token).toBeDefined();
    expect(token).toMatch(/^\d+:AA/);
  });

  it('should have GROQ_API_KEY set', () => {
    const key = process.env.GROQ_API_KEY;
    expect(key).toBeDefined();
    expect(key).toMatch(/^gsk_/);
  });

  it('should validate Telegram token format', () => {
    const token = process.env.TELEGRAM_TOKEN;
    if (!token) return;
    
    const parts = token.split(':');
    expect(parts).toHaveLength(2);
    expect(parts[0]).toMatch(/^\d+$/);
    expect(parts[1]).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('should validate Groq API key format', () => {
    const key = process.env.GROQ_API_KEY;
    if (!key) return;
    
    expect(key.startsWith('gsk_')).toBe(true);
    expect(key.length).toBeGreaterThan(20);
  });

  it('should be able to make a test Groq API call', async () => {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      console.log('Skipping Groq API test - no key');
      return;
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip, deflate'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Say hello' }
          ],
          temperature: 0.7,
          max_tokens: 100
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.choices).toBeDefined();
      expect(data.choices[0].message.content).toBeDefined();
    } catch (error) {
      console.error('Groq API test error:', error);
      throw error;
    }
  });
});
