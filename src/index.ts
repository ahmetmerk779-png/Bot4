import mineflayer from 'mineflayer';
import { pathfinder } from 'mineflayer-pathfinder';
import { loadConfig } from './configManager';
import './server'; // Web sunucusunu başlatır
import { io } from './server';
import { setupChatCraftBridge } from './chatcraftBridge'; // Yeni eklenen köprü

const config = loadConfig();

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
  
  // ChatCraft Radar ve GUI köprüsünü bota bağlıyoruz
  setupChatCraftBridge(bot, io);
  startAfkBehavior();
});

// AFK ve Kafa Çevirme Özelliği
function startAfkBehavior() {
  setInterval(() => {
    if (!bot.entity) return;
    const yaw = bot.entity.yaw + (Math.random() * 0.6 - 0.3);
    const pitch = bot.entity.pitch + (Math.random() * 0.2 - 0.1);
    bot.look(yaw, pitch, false);
  }, 5000); 
}

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

bot.on('end', () => {
  const endMsg = '[BİLGİ] Bağlantı koptu, yeniden bağlanma hazırlığı yapılıyor...';
  console.log(endMsg);
  io.emit('log', endMsg);
});
