import mineflayer from 'mineflayer';

export function startMobFarm(bot: mineflayer.Bot) {
  setInterval(() => {
    const mob = bot.nearestEntity(e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 5);
    if (mob) {
      bot.lookAt(mob.position);
      bot.attack(mob);
    }
  }, 1000);
}
