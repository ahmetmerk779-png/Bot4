import mineflayer from 'mineflayer';
import { Server } from 'socket.io';

export async function autoFarm(bot: mineflayer.Bot, io: Server) {
  try {
    const boneMeal = bot.inventory.items().find(item => item.name === 'bone_meal');

    if (!boneMeal) {
      io.emit('log', '[TARIM] Envanterde Kemik Tozu (bone_meal) bulunamadı!');
      bot.chat('/msg ' + (bot as any).ownerName + ' Çiftçilik için kemik tozum kalmadı!');
      return;
    }

    // Eline kemik tozunu kuşan
    await bot.equip(boneMeal, 'hand');

    // Botun etrafındaki 8 blokluk alanda ekin (wheat vb.) arayalım
    const block = bot.findBlock({
      matching: (b) => b && (b.name === 'wheat' || b.name === 'carrots' || b.name === 'potatoes'),
      maxDistance: 6
    });

    if (!block) {
      io.emit('log', '[TARIM] Yakınlarda büyümesi gereken ekin bulunamadı.');
      return;
    }

    // Ekinin üzerine kemik tozu uygulama (sağ tık simülasyonu)
    await bot.activateBlock(block);
    const successMsg = `[TARIM] ${block.name} ekinine kemik tozu uygulandı!`;
    console.log(successMsg);
    io.emit('log', successMsg);

  } catch (err: any) {
    const errorMsg = `[TARIM HATA]: ${err.message}`;
    console.log(errorMsg);
    io.emit('log', errorMsg);
  }
}
