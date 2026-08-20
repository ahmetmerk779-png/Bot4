import mineflayer from 'mineflayer';
import { Vec3 } from 'vec3';

export async function useRedstoneTool(bot: mineflayer.Bot, io: any, toolName: string) {
  try {
    const item = bot.inventory.items().find(i => i.name.includes(toolName));
    if (!item) {
      io.emit('log', `[REDSTONE] Envanterde ${toolName} bulunamadı!`);
      return;
    }
    await bot.equip(item, 'hand');
    
    // Botun baktığı yönün önüne yerleştirme
    const p = bot.entity.position.floored().offset(1, 0, 0);
    const refBlock = bot.blockAt(p.offset(0, -1, 0));
    
    if (refBlock) {
      await bot.placeBlock(refBlock, new Vec3(0, 1, 0));
      io.emit('log', `[REDSTONE] ${toolName} başarıyla yerleştirildi.`);
    }
  } catch (err: any) {
    io.emit('log', `[REDSTONE HATA] ${err.message}`);
  }
}
