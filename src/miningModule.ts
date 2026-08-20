import mineflayer from 'mineflayer';
import { goals } from 'mineflayer-pathfinder';

export async function mineBlock(bot: mineflayer.Bot, blockName: string) {
  const block = bot.findBlock({ matching: (b) => b.name === blockName, maxDistance: 32 });
  if (!block) return;

  await bot.pathfinder.goto(new goals.GoalLookAtBlock(block.position, bot.world));
  await bot.dig(block);
}
