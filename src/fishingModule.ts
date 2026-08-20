import mineflayer from 'mineflayer';
import { Server } from 'socket.io';

export async function startAutoFishing(bot: mineflayer.Bot, io: Server) {
  try {
    const rodItem = bot.inventory.items().find(item => item.name === 'fishing_rod');

    if (!rodItem) {
      const msg = '[BALIKÇILIK] Envanterde olta (fishing_rod) bulunamadı!';
      io.emit('log', msg);
      bot.chat(`/msg ${(bot as any).ownerName} Balık tutmak için oltaya ihtiyacım var!`);
      return;
    }

    // Oltayı ele kuşan
    await bot.equip(rodItem, 'hand');
    io.emit('log', '[BALIKÇILIK] Olta kuşanıldı, suya atılıyor...');
    bot.chat(`/msg ${(bot as any).ownerName} Balık tutmaya başlıyorum.`);

    // Oltayı suya fırlat
    bot.activateItem();

    // Kancaya balık vurduğunda (ses veya hareket algılandığında) tetiklenecek olay
    const fishingListener = async (soundName: string, position: any) => {
      // Minecraft'ta balık kancaya vurduğunda 'entity.fishing_bobber.splash' sesi çıkar
      if (soundName === 'entity.fishing_bobber.splash') {
        io.emit('log', '[BALIKÇILIK] Balık yakalandı! Çekiliyor...');
        
        // Oltayı geri çek
        bot.activateItem();

        // Kısa bir gecikme sonra tekrar oltayı at (döngüsel balıkçılık)
        setTimeout(() => {
          if (bot.inventory.items().find(item => item.name === 'fishing_rod')) {
            bot.activateItem();
            io.emit('log', '[BALIKÇILIK] Olta yeniden suya atıldı.');
          }
        }, 1500);
      }
    };

    // Ses olayını dinlemeye başla
    bot.on('soundEffectHeard', fishingListener);

  } catch (err: any) {
    const errorMsg = `[BALIKÇILIK HATA]: ${err.message}`;
    console.log(errorMsg);
    io.emit('log', errorMsg);
  }
}
