import mineflayer from 'mineflayer';
import { Server } from 'socket.io';

export async function useCobweb(bot: mineflayer.Bot, io: Server, targetEntity: any) {
  try {
    // Envanterde örümcek ağı arıyoruz
    const cobwebItem = bot.inventory.items().find(item => item.name === 'cobweb');
    
    if (!cobwebItem) {
      io.emit('log', '[SAVAŞ ARAÇLARI] Envanterde Örümcek Ağı (cobweb) bulunamadı!');
      return;
    }

    // Botun eline örümcek ağını kuşanması
    await bot.equip(cobwebItem, 'hand');

    // Hedefin olduğu konuma ağı yerleştirme (hedefin ayak ucu)
    const targetPos = targetEntity.position.floored();
    const referenceBlock = bot.blockAt(targetPos.offset(0, -1, 0));

    if (referenceBlock) {
      await bot.placeBlock(referenceBlock, new mineflayer.vec3(0, 1, 0));
      const successMsg = `[SAVAŞ ARAÇLARI] Düşmanın önüne Örümcek Ağı yerleştirildi!`;
      console.log(successMsg);
      io.emit('log', successMsg);
    }
  } catch (err: any) {
    io.emit('log', `[HATA] Örümcek ağı yerleştirilemedi: ${err.message}`);
  }
}

export async function useFishingRod(bot: mineflayer.Bot, io: Server) {
  try {
    // Envanterde olta (fishing_rod) arıyoruz
    const rodItem = bot.inventory.items().find(item => item.name === 'fishing_rod');

    if (!rodItem) {
      io.emit('log', '[SAVAŞ ARAÇLARI] Envanterde Olta (fishing_rod) bulunamadı!');
      return;
    }

    // Eline oltayı kuşan
    await bot.equip(rodItem, 'hand');

    // Oltayı fırlat (veya geri çek)
    bot.activateItem();
    const rodMsg = `[SAVAŞ ARAÇLARI] Olta kullanıldı (Fırlatıldı / Çekildi).`;
    console.log(rodMsg);
    io.emit('log', rodMsg);

  } catch (err: any) {
    io.emit('log', `[HATA] Olta kullanılamaz: ${err.message}`);
  }
}
