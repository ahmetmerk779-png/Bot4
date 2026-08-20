import mineflayer from 'mineflayer';
import { Server } from 'socket.io';

export async function depositItems(bot: mineflayer.Bot, io: Server) {
  const chestBlock = bot.findBlock({ matching: (b) => b.name === 'chest', maxDistance: 4 });
  if (!chestBlock) {
    io.emit('log', '[DEPO] Yakında sandık bulunamadı!');
    return;
  }

  const chest = await bot.openChest(chestBlock);
  const itemsToDeposit = bot.inventory.items().filter(i => i.name !== 'fishing_rod' && i.name !== 'sword');

  for (const item of itemsToDeposit) {
    await chest.deposit(item.type, null, item.count);
  }
  
  await chest.close();
  io.emit('log', '[DEPO] Eşyalar başarıyla sandığa aktarıldı.');
}
