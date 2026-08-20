import mineflayer from 'mineflayer';
import { Server } from 'socket.io';
import { BotConfig } from './configManager';

export function setupAutoReconnect(bot: mineflayer.Bot, config: BotConfig, io: Server, createBotInstance: () => void) {
  
  bot.on('end', (reason) => {
    const msg = `[BAĞLANTI KOPTU] Sebep: ${reason}. 5 saniye içinde yeniden bağlanılıyor...`;
    console.log(msg);
    io.emit('log', msg);

    // 5 saniye bekleyip yeniden bağlanma fonksiyonunu tetikliyoruz
    setTimeout(() => {
      const reconnectMsg = '[YENİDEN BAĞLANMA] Sunucuya tekrar bağlanma deneniyor...';
      console.log(reconnectMsg);
      io.emit('log', reconnectMsg);
      
      try {
        createBotInstance();
      } catch (err: any) {
        const errorMsg = `[YENİDEN BAĞLANMA HATASI]: ${err.message}`;
        console.log(errorMsg);
        io.emit('log', errorMsg);
      }
    }, 5000);
  });

  bot.on('kicked', (reason) => {
    const kickMsg = `[ATILDI] Bot sunucudan atıldı! Sebep: ${reason}`;
    console.log(kickMsg);
    io.emit('log', kickMsg);
  });
}
