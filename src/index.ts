import mineflayer from 'mineflayer';
import { pathfinder } from 'mineflayer-pathfinder';

// Render çevre değişkenlerinden (Environment Variables) veya doğrudan bu alandan ayarlanabilir
const botConfig = {
  host: process.env.MC_HOST || 'oyun_sunucu_ip_adresi', 
  port: parseInt(process.env.MC_PORT || '25565'),                  
  username: process.env.MC_USERNAME || 'OtonomBot',        
  version: '1.21.11',           // Kesinlikle istenen Minecraft sürümü
  ownerName: process.env.MC_OWNER || 'SeninKullaniciAdin' // Sadece senden gelen /msg'leri kabul eder
};

const bot = mineflayer.createBot({
  host: botConfig.host,
  port: botConfig.port,
  username: botConfig.username,
  version: botConfig.version
});

// Pathfinder eklentisini bota yüklüyoruz
bot.loadPlugin(pathfinder);

bot.once('spawn', () => {
  console.log(`[BAŞARILI] Bot ${bot.username} oyuna giriş yaptı! Sürüm: ${botConfig.version}`);
  startAfkBehavior();
});

// AFK Özelliği: Botun oyundan düşmesini engellemek için hafif kafa hareketleri
function startAfkBehavior() {
  setInterval(() => {
    if (!bot.entity) return;
    const yaw = bot.entity.yaw + (Math.random() * 0.6 - 0.3);
    const pitch = bot.entity.pitch + (Math.random() * 0.2 - 0.1);
    bot.look(yaw, pitch, false);
  }, 5000); 
}

// İletişim Güvenliği: Yalnızca sahibinden gelen /msg komutlarını dinleme
bot.on('whisper', (username, message) => {
  if (username !== botConfig.ownerName) {
    bot.chat(`/msg ${username} Üzgünüm, ben sadece sahibim ile iletişim kurarım.`);
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
  console.log('[BİLGİ] Bağlantı koptu, yeniden bağlanma hazırlığı...');
});
