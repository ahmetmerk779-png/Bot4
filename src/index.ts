import mineflayer from 'mineflayer';
import { pathfinder, Movements } from 'mineflayer-pathfinder';
import { loadConfig } from './configManager';
import './server'; 
import { io } from './server';
import { setupChatCraftBridge } from './chatcraftBridge';
import { setupAutoReconnect } from './autoReconnect';
import { setupPvpModule } from './pvpModule';
import { askAiBrain } from './aiBrain';
import { buildSchematic } from './schematicModule';
import { useCobweb, useFishingRod } from './combatToolsModule';
import { autoFarm } from './farmingModule';
import { startAutoFishing } from './fishingModule';
import { useRedstoneTool } from './redstoneModule';
import { depositItems } from './chestModule';
import { mineBlockWithInventoryCheck } from './miningModule'; // Güncellenmiş Madencilik
import { startMobFarm } from './mobFarmModule';

const config = loadConfig();

function startBot() {
  const bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.username,
    version: config.version
  });

  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    io.emit('log', `Bot ${bot.username} oyunda!`);
    
    // Hareket eklentisini yapılandır
    const defaultMove = new Movements(bot);
    bot.pathfinder.setMovements(defaultMove);
    
    setupChatCraftBridge(bot, io);
    setupPvpModule(bot, io);
    startAfkBehavior(bot);
  });

  setupAutoReconnect(bot, config, io, startBot);

  bot.on('whisper', async (username, message) => {
    if (username !== config.ownerName) return;
    const lowerMsg = message.toLowerCase();

    // 1. Modüler Komutlar (Otonom Görevler)
    if (lowerMsg === 'dur') {
      bot.pathfinder.setGoal(null);
      bot.chat(`/msg ${username} Durduruldu.`);
    } 
    else if (lowerMsg === 'depola') {
      await depositItems(bot, io);
      bot.chat(`/msg ${username} Eşyalar depolandı.`);
    } 
    else if (lowerMsg.startsWith('kaz ')) {
      const blockName = message.split(' ')[1];
      bot.chat(`/msg ${username} ${blockName} kazılıyor...`);
      await mineBlockWithInventoryCheck(bot, blockName);
    } 
    else if (lowerMsg === 'mob avla') {
      startMobFarm(bot);
      bot.chat(`/msg ${username} Mob avı başlatıldı.`);
    } 
    else if (lowerMsg === 'olta at') await useFishingRod(bot, io);
    else if (lowerMsg === 'balik tut') await startAutoFishing(bot, io);
    else if (lowerMsg === 'ag at') {
      const target = bot.nearestEntity(e => e.type === 'mob' || e.type === 'player');
      if (target) await useCobweb(bot, io, target);
    } 
    else if (lowerMsg === 'tarim yap') await autoFarm(bot, io);
    else if (lowerMsg.startsWith('redstone kur')) await useRedstoneTool(bot, io, message.split(' ')[2]);
    else if (lowerMsg.startsWith('insa et')) await buildSchematic(bot, io, message.split(' ')[2]);
    
    // 2. Yapay Zeka Beyin (Komut değilse)
    else {
      const aiAnswer = await askAiBrain(message, `Konum: ${Math.round(bot.entity.position.x)}, Can: ${bot.health}`);
      bot.chat(`/msg ${username} ${aiAnswer}`);
    }
  });

  bot.on('error', (err) => io.emit('log', `[HATA] ${err.message}`));
}

function startAfkBehavior(bot: mineflayer.Bot) {
  setInterval(() => {
    if (bot.entity) bot.look(bot.entity.yaw + 0.1, bot.entity.pitch, false);
  }, 5000);
}

startBot();
