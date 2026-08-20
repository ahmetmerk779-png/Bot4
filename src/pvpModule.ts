import mineflayer from 'mineflayer';
import { goals, Movements } from 'mineflayer-pathfinder';
import { Server } from 'socket.io';

export function setupPvpModule(bot: mineflayer.Bot, io: Server) {
  let targetEntity: any = null;
  let isFighting = false;

  // Hareket eklentisi için temel ayarlar
  const defaultMove = new Movements(bot);

  // 1. SAVAŞ DÖNGÜSÜ: Sürekli etrafı tarayıp düşman arama ve saldırı
  setInterval(() => {
    if (!bot.entity) return;

    // HARDCODED INTERRUPT: Can %20'nin altına düşerse savaşı bırak ve kaç!
    if (bot.health <= 4) { // Minecraft'ta can 20 tam kalptir, 4 can %20 demektir
      if (isFighting) {
        const warningMsg = '[ACİL DURUM] Can %20 altına düştü! Savaş durduruluyor, kaçılıyor...';
        console.log(warningMsg);
        io.emit('log', warningMsg);
        bot.pathfinder.setGoal(null);
        isFighting = false;
        targetEntity = null;
        
        // Geriye doğru kaçma hareketi (örneğin botun arkasına doğru gitme simülasyonu)
        bot.setControlState('back', true);
        setTimeout(() => bot.setControlState('back', false), 3000);
      }
      return;
    }

    // Eğer zaten dövüşmüyorsak, en yakın saldırgan yaratığı veya hedefi bulalım
    if (!isFighting) {
      const filter = (entity: any) => 
        entity.type === 'mob' && 
        (entity.name === 'zombie' || entity.name === 'skeleton' || entity.name === 'creeper') &&
        bot.entity.position.distanceTo(entity.position) < 16; // 16 blok yarıçap

      const target = bot.nearestEntity(filter);

      if (target) {
        targetEntity = target;
        isFighting = true;
        const attackMsg = `[SAVAŞ] Hedef tespit edildi: ${target.name}. Saldırı başlatılıyor!`;
        console.log(attackMsg);
        io.emit('log', attackMsg);

        // Hedefe yaklaşmak için pathfinder kullanıyoruz
        bot.pathfinder.setMovements(defaultMove);
        bot.pathfinder.setGoal(new goals.GoalFollow(target, 1), true); // 1 blok yaklaş
      }
    } else {
      // Dövüş durumundaysak hedef hala geçerli mi kontrol edelim
      if (!targetEntity || !targetEntity.isValid) {
        const victoryMsg = '[SAVAŞ] Hedef ortadan kalktı, savaş durumu sonlandırıldı.';
        console.log(victoryMsg);
        io.emit('log', victoryMsg);
        bot.pathfinder.setGoal(null);
        isFighting = false;
        targetEntity = null;
        return;
      }

      // Hedefe çok yaklaşıldıysa vuruş yap
      const distance = bot.entity.position.distanceTo(targetEntity.position);
      if (distance <= 3) {
        bot.lookAt(targetEntity.position.offset(0, targetEntity.height, 0));
        bot.attack(targetEntity);
      }
    }
  }, 500); // Her yarım saniyede bir PvP mantığını kontrol et
}
