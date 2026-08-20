import { Bot } from 'mineflayer';
import { Server } from 'socket.io';

export function setupChatCraftBridge(bot: Bot, io: Server) {
  
  // 1. RADAR SİSTEMİ: Botun etrafındaki varlıkları periyodik olarak tarayıp web paneline gönderme
  setInterval(() => {
    if (!bot.entity) return;

    const entities = Object.values(bot.entities).map((entity: any) => {
      // Sadece oyuncuları, mobları ve önemli varlıkları alalım
      if (entity === bot.entity) return null;
      
      const distance = bot.entity.position.distanceTo(entity.position);
      if (distance > 32) return null; // 32 blokluk yarıçap

      return {
        id: entity.id,
        type: entity.type,
        name: entity.username || entity.name || entity.displayName,
        position: {
          x: Math.round(entity.position.x * 10) / 10,
          y: Math.round(entity.position.y * 10) / 10,
          z: Math.round(entity.position.z * 10) / 10
        },
        distance: Math.round(distance * 10) / 10
      };
    }).filter(Boolean);

    // Web paneline radar verisini ilet
    io.emit('radarUpdate', {
      botPosition: {
        x: Math.round(bot.entity.position.x * 10) / 10,
        y: Math.round(bot.entity.position.y * 10) / 10,
        z: Math.round(bot.entity.position.z * 10) / 10
      },
      entities
    });
  }, 1000); // Her 1 saniyede bir radar verisini günceller

  // 2. GUI / ENVANTER SİSTEMİ: Bot bir sandık veya menü açtığında tetiklenir
  bot.on('windowOpen', (window: any) => {
    const windowData = {
      title: window.title ? JSON.parse(window.title) : 'GUI Menu',
      slots: window.slots.map((item: any, index: number) => ({
        slot: index,
        name: item ? item.name : null,
        count: item ? item.count : 0,
        metadata: item ? item.metadata : null
      }))
    };

    console.log(`[CHATCRAFT] Bir GUI açıldı: ${window.title}`);
    io.emit('guiOpen', windowData);
  });

  bot.on('windowClose', () => {
    console.log('[CHATCRAFT] GUI kapatıldı.');
    io.emit('guiClose');
  });

  // 3. WEB PANELİNDEN GELEN TIKLAMA YÖNETİMİ (Sol Tık / Sağ Tık)
  io.on('connection', (socket) => {
    socket.on('guiClick', async (data: { slot: number, mouseButton: number }) => {
      try {
        const window = bot.currentWindow;
        if (!window) {
          socket.emit('log', '[HATA] Açık bir GUI menüsü yok!');
          return;
        }

        // Mineflayer ile pencereye tıklama (mouseButton: 0 = Sol Tık, 1 = Sağ Tık)
        await bot.clickWindow(data.slot, data.mouseButton, 0);
        socket.emit('log', `[BAŞARILI] Slot ${data.slot} üzerine tıklandı (Tip: ${data.mouseButton === 0 ? 'Sol' : 'Sağ'} Tık).`);
      } catch (err: any) {
        socket.emit('log', `[HATA] Tıklama başarısız: ${err.message}`);
      }
    });
  });
      }
