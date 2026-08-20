import mineflayer from 'mineflayer';
import { pathfinder } from 'mineflayer-pathfinder';
import { loadConfig } from './configManager';
import './server'; // Express Web Paneli ve WebSocket sunucusunu başlatır
import { io } from './server';
import { setupChatCraftBridge } from './chatcraftBridge'; // Radar ve GUI köprüsü
import { setupAutoReconnect } from './autoReconnect';     // Otomatik yeniden bağlanma
import { setupPvpModule } from './pvpModule';             // PvP ve %20 Can Kuralı (Hardcoded Interrupt)
import { askAiBrain } from './aiBrain';                   // Groq Yapay Zeka Beyni
import { buildSchematic } from './schematicModule';       // Şematik Okuma ve İnşa

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

  // Pathfinder hareket eklentisini bota yüklüyoruz
  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    const msg = `[BAŞARILI] Bot ${bot.username} oyuna giriş yaptı!`;
    console.log(msg);
    io.emit('log', msg);
    
    // Alt sistemleri ve modülleri bota bağlıyoruz
    setupChatCraftBridge(bot, io);
    setupPvpModule(bot, io);
    startAfkBehavior(bot);
  });

  // Otomatik Yeniden Bağlanma Mekanizması
  setupAutoReconnect(bot, config, io, startBot);

  // Güvenli İletişim ve Yapay Zeka / Şematik Komut Yöneticisi
  bot.on('whisper', async (username, message) => {
    // Sadece web panelinde tanımlanan sahibinden gelen /msg komutlarını dinler
    if (username !== config.ownerName) {
      bot.chat(`/msg ${username} Üzgünüm, ben sadece sahibim (${config.ownerName}) ile iletişim kurarım.`);
      return;
    }

    const logMsg = `[ÖZEL MESAJ] ${username}: ${message}`;
    console.log(logMsg);
    io.emit('log', logMsg);
    
    // Sabit Komut: Dur
    if (message.toLowerCase() === 'dur') {
      bot.chat(`/msg ${username} Komut alındı, duruyorum.`);
      bot.pathfinder.setGoal(null);
      return;
    }

    // Sabit Komut: Şematik İnşa Et (Örnek: "insa et ev.schem")
    if (message.toLowerCase().startsWith('insa et')) {
      const parts = message.split(' ');
      const fileName = parts[2] || 'ev.schem';
      bot.chat(`/msg ${username} ${fileName} şeması okunuyor ve inşa hazırlığı yapılıyor!`);
      io.emit('log', `[ŞEMATİK KOMUTU] ${fileName} inşa süreci tetiklendi.`);
      await buildSchematic(bot, io, fileName);
      return;
    }

    // Diğer tüm mesajlar Groq Yapay Zeka Beynine iletilir
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

// AFK Özelliği: Botun kafasını hafifçe hareket ettirerek sunucudan atılmasını önler
function startAfkBehavior(bot: mineflayer.Bot) {
  setInterval(() => {
    if (!bot.entity) return;
    const yaw = bot.entity.yaw + (Math.random() * 0.6 - 0.3);
    const pitch = bot.entity.pitch + (Math.random() * 0.2 - 0.1);
    bot.look(yaw, pitch, false);
  }, 5000); 
}

// Bot uygulamasını ilk kez başlatıyoruz
startBot();
