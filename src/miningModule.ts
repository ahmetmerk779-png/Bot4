import mineflayer from 'mineflayer';
import { goals } from 'mineflayer-pathfinder';
import { depositItems } from './chestModule';
import { io } from './server';

// Üs koordinatlarını buraya tanımla veya konfigürasyondan çek
const homePosition = new mineflayer.vec3(100, 64, 100); 

export async function mineBlockWithInventoryCheck(bot: mineflayer.Bot, blockName: string) {
  // 1. Envanter kontrolü
  if (bot.inventory.items().length >= 35) { // 36 slot var, 35 doluysa doludur
    io.emit('log', '[MADEN] Envanter dolu! Üsse dönülüyor...');
    bot.chat('Envanterim doldu, eşyaları boşaltmaya gidiyorum.');
    
    // 2. Üsse git
    await bot.pathfinder.goto(new goals.GoalBlock(homePosition.x, homePosition.y, homePosition.z));
    
    // 3. Depolama işlemini başlat
    await depositItems(bot, io);
    return;
  }

  // 4. Normal kazma işlemini gerçekleştir
  const block = bot.findBlock({ matching: (b) => b.name === blockName, maxDistance: 32 });
  if (!block) {
    bot.chat('Yakında kazacak ' + blockName + ' bulamadım.');
    return;
  }

  await bot.pathfinder.goto(new goals.GoalLookAtBlock(block.position, bot.world));
  await bot.dig(block);
}
