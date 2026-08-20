import mineflayer from 'mineflayer';
import { Server } from 'socket.io';

export async function useRedstoneTool(bot: mineflayer.Bot, io: Server, toolName: string) {
  try {
    // Envanterde istenen redstone aletini arıyoruz (Örn: 'redstone_torch', 'lever', 'repeater' vb.)
    const redstoneItem = bot.inventory.items().find(item => item.name.includes(toolName));

    if (!redstoneItem) {
      const msg = `[REDSTONE] Envanterde '${toolName}' içeren bir eşya bulunamadı!`;
      io.emit('log', msg);
      bot.chat(`/msg ${(bot as any).ownerName} Çantamda ${toolName} kalmadı.`);
      return;
    }

    // Eline aleti kuşan
    await bot.equip(redstoneItem, 'hand');

    // Botun ayak altındaki bloğu referans alarak yerleştirme yapıyoruz
    const botPos = bot.entity.position.floored();
    const referenceBlock = bot.blockAt(botPos.offset(0, -1, 0));

    if (referenceBlock) {
      await bot.placeBlock(referenceBlock, new mineflayer.vec3(0, 1, 0));
      const successMsg = `[REDSTONE] ${redstoneItem.name} başarıyla yerleştirildi!`;
      console.log(successMsg);
      io.emit('log', successMsg);
      bot.chat(`/msg ${(bot as any).ownerName} ${redstoneItem.name} yerleştirildi.`);
    } else {
      io.emit('log', '[REDSTONE HATA] Yerleştirilecek uygun bir referans blok bulunamadı.');
    }

  } catch (err: any) {
    const errorMsg = `[REDSTONE HATA]: ${err.message}`;
    console.log(errorMsg);
    io.emit('log', errorMsg);
  }
}
