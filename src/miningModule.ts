import mineflayer from 'mineflayer';
import { goals } from 'mineflayer-pathfinder';
import { Vec3 } from 'vec3'; // <-- Doğru import
import { depositItems } from './chestModule';
import { io } from './server';

// Üs koordinatları
const homePosition = new Vec3(100, 64, 100); 

export async function mineBlockWithInventoryCheck(bot: mineflayer.Bot, blockName: string) {
  if (bot.inventory.items().length >= 35) {
    io.emit('log', '[MADEN] Envanter dolu! Üsse dönülüyor...');
    bot.chat('Envanterim doldu, eşyaları boşaltmaya gidiyorum.');
    
    await bot.pathfinder.goto(new goals.GoalBlock(homePosition.x, homePosition.y, homePosition.z));
    await depositItems(bot, io);
    return;
  }

  const block = bot.findBlock({ matching: (b) => b.name === blockName, maxDistance: 32 });
  if (!block) {
    bot.chat('Yakında kazacak ' + blockName + ' bulamadım.');
    return;
  }

  await bot.pathfinder.goto(new goals.GoalLookAtBlock(block.position, bot.world));
  await bot.dig(block);
}
