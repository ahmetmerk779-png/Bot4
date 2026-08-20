import mineflayer from 'mineflayer';
import { Vec3 } from 'vec3';

export async function useFishingRod(bot: mineflayer.Bot, io: any) {
  try {
    const fishingRod = bot.inventory.items().find(item => item.name.includes('fishing_rod'));
    if (!fishingRod) {
      io.emit('log', '[SAVAŞ] Envanterde olta bulunamadı!');
      return;
    }
    await bot.equip(fishingRod, 'hand');
    // Olta atma mantığı
    io.emit('log', '[SAVAŞ] Olta kullanıldı.');
  } catch (err: any) {
    io.emit('log', `[OLTA HATA] ${err.message}`);
  }
}

export async function useCobweb(bot: mineflayer.Bot, io: any, target: any) {
  try {
    const cobweb = bot.inventory.items().find(item => item.name.includes('cobweb'));
    if (!cobweb) {
      io.emit('log', '[SAVAŞ] Envanterde örümcek ağı yok!');
      return;
    }
    await bot.equip(cobweb, 'hand');
    const targetPos = new Vec3(Math.floor(target.position.x), Math.floor(target.position.y), Math.floor(target.position.z));
    const referenceBlock = bot.blockAt(targetPos.offset(0, -1, 0));
    if (referenceBlock) {
      await bot.placeBlock(referenceBlock, new Vec3(0, 1, 0));
      io.emit('log', '[SAVAŞ] Hedefin altına örümcek ağı yerleştirildi.');
    }
  } catch (err: any) {
    io.emit('log', `[AĞ HATA] ${err.message}`);
  }
}
