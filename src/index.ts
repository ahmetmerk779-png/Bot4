import mineflayer from 'mineflayer';
import { pathfinder } from 'mineflayer-pathfinder';
import { loadConfig } from './configManager';
import './server';
import { io } from './server';
import { setupChatCraftBridge } from './chatcraftBridge';
import { setupAutoReconnect } from './autoReconnect';
import { setupPvpModule } from './pvpModule';
import { askAiBrain } from './aiBrain'; // Yapay zeka modülü eklendi

const config = loadConfig();

function startBot() {
  console.log(`[BAŞLANGIÇ] Bot ${config.username} başlatılıyor... Sürüm: ${config.version}`);
  io.emit('log', `Bot ${config.username} başlatılıyor... Sürüm: ${config.version}`);

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
    
    setupChatCraftBridge(bot, io);
    setupPvpModule(bot, io);
    startAfkBehavior(bot);
  });

  setupAutoReconnect(bot, config, io, startBot);

  // Yapay Zeka Destekli /msg İletişimi
  bot.on('whisper', async (username, message) => {
    if (username !== config.ownerName) {
      bot.chat(`/msg ${username} Üzgünüm, ben sadece sahibim (${config.ownerName}) ile iletişim kurarım.`);
      return;
    }

    const logMsg = `[ÖZEL MESAJ] ${username}: ${message}`;
    console.log(logMsg);
    io.emit('log', logMsg);
    
    if (message.toLowerCase() === 'dur') {
      bot.chat(`/msg ${username} Komut alındı, duruyorum.`);
      bot.pathfinder.setGoal(null);
      return;
    }

    // Gelen mesajı Groq Yapay Zeka Beynine gönderiyoruz
    bot.chat(`/msg ${username} Düşünüyorum...`);
    const aiAnswer = await askAiBrain(message, `Botun konumu: x:${Math.round(bot.entity.position.x)}, y:${Math.round(bot.entity.position.y)}, z:${Math.round(bot.entity.position.z)}, Can: ${bot.health}`);
    
    // Yanıtı sahibine iletiyoruz
    bot.chat(`/msg ${username} ${aiAnswer}`);
    io.emit('log', `[YAPAY ZEKA YANITI]: ${aiAnswer}`);
  });

  bot.on('error', (err) => {
    const errorMsg = `[HATA]: ${err.message}`;
    console.log(errorMsg);
    io.emit('log', errorMsg);
  });
}

function startAfkBehavior(bot: mineflayer.Bot) {
  setInterval(() => {
    if (!bot.entity) return;
    const yaw = bot.entity.yaw + (Math.random() * 0.6 - 0.3);
    const pitch = bot.entity.pitch + (Math.random() * 0.2 - 0.1);
    bot.look(yaw, pitch, false);
  }, 5000); 
}

startBot();
