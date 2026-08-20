import mineflayer from 'mineflayer';
import { pathfinder } from 'mineflayer-pathfinder';
import { loadConfig, loadMemory } from './configManager';

// Web panelinden yönetilen konfigürasyonu yüklüyoruz
const config = loadConfig();
const memory = loadMemory();

console.log(`[BAŞLANGIÇ] Bot ${config.username} için ayarlar yükleniyor... Sürüm: ${config.version}`);

const bot = mineflayer.createBot({
  host: config.host,
  port: config.port,
  username: config.username,
  version: config.version
});

bot.loadPlugin(pathfinder);

bot.once('spawn', () => {
  console.log(`[BAŞARILI] Bot ${bot.username} oyuna giriş yaptı!`);
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

// Sadece Web Panelinde belirlenen "ownerName" ile /msg üzerinden iletişim
bot.on('whisper', (username, message) => {
  if (username !== config.ownerName) {
    bot.chat(`/msg ${username} Üzgünüm, ben sadece sahibim (${config.ownerName}) ile iletişim kurarım.`);
    return;
  }

  console.log(`[ÖZEL MESAJ] ${username}: ${message}`);
  
  if (message.toLowerCase() === 'dur') {
    bot.chat(`/msg ${username} Komut alındı, duruyorum.`);
    bot.pathfinder.setGoal(null);
  }
});

bot.on('error', (err) => console.log('[HATA]:', err));
bot.on('end', () => {
  console.log('[BİLGİ] Bağlantı koptabaşlatılıyor, otomatik yeniden bağlanma tetiklenecek...');
});
