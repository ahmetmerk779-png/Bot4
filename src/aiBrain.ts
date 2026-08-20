import Groq from 'groq-sdk';
import { loadMemory, updateMemory } from './configManager';

// Groq istemcisini başlatıyoruz (API anahtarını çevre değişkeninden veya doğrudan buraya yazabilirsin)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'BURAYA_GROQ_API_ANAHTARINI_YAZ'
});

export async function askAiBrain(prompt: string, contextData: string = ''): Promise<string> {
  try {
    const memory = loadMemory();

    const systemPrompt = `
      Sen Minecraft 1.21.11 sürümünde çalışan otonom bir botun yapay zeka beynisin.
      Sahibinle /msg üzerinden konuşuyorsun. Görevlerin arasında hayatta kalma, madencilik, PvP ve inşa var.
      Botun mevcut hafızası: ${JSON.stringify(memory)}
      Ek bağlam: ${contextData}
      Kısa, net ve doğrudan uygulanabilir kararlar ver.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 300
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || 'Üzgünüm, şu anda düşünemiyorum.';
    return aiResponse;

  } catch (error: any) {
    console.log(`[YAPAY ZEKA HATA]: ${error.message}`);
    return 'Yapay zeka beynine bağlanırken bir hata oluştu.';
  }
}
