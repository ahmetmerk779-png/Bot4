import mineflayer from 'mineflayer';
import { pathfinder } from 'mineflayer-pathfinder';
import { loadConfig } from './configManager';
import './server'; // Web sunucusunu başlatır
import { io } from './server';
import { setupChatCraftBridge } from './chatcraftBridge';
import { setupAutoReconnect } from './autoReconnect';
import { setupPvpModule } from './pvpModule'; // Yeni eklenen PvP modülü

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
    
    // Alt sistemleri bota bağlıyoruz
    setupChatCraftBridge(bot, io);
    setupPvpModule(bot, io); // PvP modülü aktif edildi
    startAfkBehavior(bot);
  });

  // Otomatik Yeniden Bağlanma Mekanizması
  setupAutoReconnect(bot, config, io, startBot);

  // Güvenli İletişim: Sadece sahibinden gelen /msg komutları
  bot.on('whisper', (username, message) => {
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
    }
  });

  bot.on('error', (err) => {
    const errorMsg = `[HATA]: ${err.message}`;
    console.log(errorMsg);
    io.emit('log', errorMsg);
  });
}

// AFK ve Kafa Çevirme Özelliği
function startAfkBehavior(bot: mineflayer.Bot) {
  setInterval(() => {
    if (!bot.entity) return;
    const yaw = bot.entity.yaw + (Math.random() * 0.6 - 0.3);
    const pitch = bot.entity.pitch + (Math.random() * 0.2 - 0.1);
    bot.look(yaw, pitch, false);
  }, 5000); 
}

// Botu başlatıyoruz
startBot();
