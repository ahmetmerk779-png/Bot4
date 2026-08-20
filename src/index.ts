import mineflayer from 'mineflayer';
import { pathfinder, Movements } from 'mineflayer-pathfinder';
import { loadConfig } from './configManager';
import './server'; // Express ve Socket.io Web Kontrol Paneli
import { io } from './server';
import { setupChatCraftBridge } from './chatcraftBridge';
import { setupAutoReconnect } from './autoReconnect';
import { setupPvpModule } from './pvpModule';
import { askAiBrain } from './aiBrain';
import { buildSchematic } from './schematicModule';
import { useCobweb, useFishingRod } from './combatToolsModule';
import { autoFarm } from './farmingModule';
import { startAutoFishing } from './fishingModule';
import { useRedstoneTool } from './redstoneModule';
import { depositItems } from './chestModule';
import { mineBlockWithInventoryCheck } from './miningModule';
import { startMobFarm } from './mobFarmModule';

const config = loadConfig();

function startBot() {
  console.log(`[BAŞLANGIÇ] Bot ${config.username} başlatılıyor...`);
  io.emit('log', `Bot ${config.username} başlatılıyor...`);

  const bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.username,
    version: config.version
  });

  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    const msg = `[BAŞARILI] Bot ${bot.username} oyuna giriş yaptı!`;
    console.log(msg);
    io.emit('log', msg);
    
    // Pathfinder hareket eklentisi yapılandırması
    const defaultMove = new Movements(bot);
    bot.pathfinder.setMovements(defaultMove);
    
    setupChatCraftBridge(bot, io);
    setupPvpModule(bot, io);
    startAfkBehavior(bot);
  });

  // Otomatik Yeniden Bağlanma
  setupAutoReconnect(bot, config, io, startBot);

  // Whisper (Fısıltı) ve Komut Yöneticisi
  bot.on('whisper', async (username, message) => {
    if (username !== config.ownerName) {
      bot.chat(`/msg ${username} Üzgünüm, ben sadece sahibim (${config.ownerName}) ile iletişim kurarım.`);
      return;
    }

    const logMsg = `[ÖZEL MESAJ] ${username}: ${message}`;
    console.log(logMsg);
    io.emit('log', logMsg);
    
    const lowerMsg = message.toLowerCase();

    // 1. Durdurma Komutu
    if (lowerMsg === 'dur') {
      bot.chat(`/msg ${username} Komut alındı, duruyorum.`);
      bot.pathfinder.setGoal(null);
      return;
    }

    // 2. Depolama Komutu
    if (lowerMsg === 'depola') {
      bot.chat(`/msg ${username} Eşyalar sandığa aktarılıyor...`);
      await depositItems(bot, io);
      return;
    }

    // 3. Madencilik Komutu (Envanter Dolunca Üsse Dönüş Özellikli)
    if (lowerMsg.startsWith('kaz ')) {
      const blockName = message.split(' ')[1];
      bot.chat(`/msg ${username} ${blockName} kazılıyor (envanter dolunca üsse döneceğim)...`);
      await mineBlockWithInventoryCheck(bot, blockName);
      return;
    }

    // 4. Mob Çiftliği / Avlanma Komutu
    if (lowerMsg === 'mob avla') {
      bot.chat(`/msg ${username} Mob avı protokolü başlatıldı.`);
      startMobFarm(bot);
      return;
    }

    // 5. Olta Atma Komutu
    if (lowerMsg === 'olta at') {
      bot.chat(`/msg ${username} Olta kullanılıyor...`);
      await useFishingRod(bot, io);
      return;
    }

    // 6. Otomatik Balıkçılık Komutu
    if (lowerMsg === 'balik tut' || lowerMsg === 'balikçilik baslat') {
      bot.chat(`/msg ${username} Otomatik balıkçılık başlatılıyor...`);
      await startAutoFishing(bot, io);
      return;
    }

    // 7. Örümcek Ağı Atma Komutu
    if (lowerMsg === 'ag at') {
      bot.chat(`/msg ${username} Örümcek ağı yerleştiriliyor...`);
      const target = bot.nearestEntity(e => e.type === 'mob' || e.type === 'player');
      if (target) {
        await useCobweb(bot, io, target);
      } else {
        bot.chat(`/msg ${username} Yakınlarda hedef bulamadım.`);
      }
      return;
    }

    // 8. Tarım ve Kemik Tozu Komutu
    if (lowerMsg === 'tarim yap' || lowerMsg === 'ekin buyut') {
      bot.chat(`/msg ${username} Tarım alanına kemik tozu uygulanıyor...`);
      await autoFarm(bot, io);
      return;
    }

    // 9. Redstone Kurulum Komutu
    if (lowerMsg.startsWith('redstone kur')) {
      const parts = message.split(' ');
      const tool = parts[2] || 'lever';
      bot.chat(`/msg ${username} ${tool} yerleştirilmesi deneniyor...`);
      await useRedstoneTool(bot, io, tool);
      return;
    }

    // 10. Şematik İnşa Komutu
    if (lowerMsg.startsWith('insa et')) {
      const parts = message.split(' ');
      const fileName = parts[2] || 'ev.schem';
      bot.chat(`/msg ${username} ${fileName} şeması okunuyor ve inşa başlıyor!`);
      await buildSchematic(bot, io, fileName);
      return;
    }

    // 11. Groq Yapay Zeka Beyin Yanıtı (Eşleşmeyen tüm mesajlar için)
    bot.chat(`/msg ${username} Düşünüyorum...`);
    const aiContext = `Botun konumu: x:${Math.round(bot.entity.position.x)}, y:${Math.round(bot.entity.position.y)}, z:${Math.round(bot.entity.position.z)}, Can: ${bot.health}`;
    const aiAnswer = await askAiBrain(message, aiContext);
    
    bot.chat(`/msg ${username} ${aiAnswer}`);
    io.emit('log', `[YAPAY ZEKA YANITI]: ${aiAnswer}`);
  });

  bot.on('error', (err) => {
    const errorMsg = `[HATA]: ${err.message}`;
    console.log(errorMsg);
    io.emit('log', errorMsg);
  });
}

// AFK Önleme Mekanizması
function startAfkBehavior(bot: mineflayer.Bot) {
  setInterval(() => {
    if (!bot.entity) return;
    const yaw = bot.entity.yaw + (Math.random() * 0.6 - 0.3);
    const pitch = bot.entity.pitch + (Math.random() * 0.2 - 0.1);
    bot.look(yaw, pitch, false);
  }, 5000); 
}

startBot();
