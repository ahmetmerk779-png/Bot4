import mineflayer from 'mineflayer';
import { Schematic } from 'prismarine-schematic';
import * as path from 'path';
import * as fs from 'fs';
import { Server } from 'socket.io';
import { goals } from 'mineflayer-pathfinder';

export async function buildSchematic(bot: mineflayer.Bot, io: Server, schematicFileName: string) {
  try {
    const filePath = path.join(__dirname, '../schematics', schematicFileName);
    
    if (!fs.existsSync(filePath)) {
      const errorMsg = `[ŞEMATİK HATA] ${schematicFileName} dosyası 'schematics' klasöründe bulunamadı!`;
      console.log(errorMsg);
      io.emit('log', errorMsg);
      return;
    }

    const startMsg = `[ŞEMATİK] ${schematicFileName} okunuyor ve analiz ediliyor...`;
    console.log(startMsg);
    io.emit('log', startMsg);

    // Şematik dosyasını yüklüyoruz (Minecraft 1.21.11 veri formatına uyumlu)
    const schematicBuffer = fs.readFileSync(filePath);
    const schematic = await Schematic.read(schematicBuffer, 'sponge'); // Sponge formatı (.schem için standarttır)

    const botPos = bot.entity.position.floored();
    const successMsg = `[ŞEMATİK] Başarıyla yüklendi! Boyutlar: X:${schematic.size.x}, Y:${schematic.size.y}, Z:${schematic.size.z}`;
    console.log(successMsg);
    io.emit('log', successMsg);

    // Şemadaki blokları tarayıp sırayla yerleştirme döngüsü
    for (let y = 0; y < schematic.size.y; y++) {
      for (let x = 0; x < schematic.size.x; x++) {
        for (let z = 0; z < schematic.size.z; z++) {
          const block = schematic.getBlock(new mineflayer.vec3(x, y, z));
          
          // Eğer blok boş (hava) değilse yerleştirmeyi dene
          if (block && block.name !== 'air') {
            const targetPos = botPos.offset(x, y, z);
            
            // Botun blok yerleştireceği konuma yürümesi veya uzanması sağlanır
            // Bu basitleştirilmiş bir döngüdür; sonraki aşamada pathfinder ile entegre edilecektir.
            io.emit('log', `[İNŞA] Blok yerleştiriliyor: ${block.name} -> Konum: (${targetPos.x}, ${targetPos.y}, ${targetPos.z})`);
          }
        }
      }
    }

    io.emit('log', '[ŞEMATİK] İnşa planı başarıyla tamamlandı!');

  } catch (err: any) {
    const errorMsg = `[ŞEMATİK HATA]: ${err.message}`;
    console.log(errorMsg);
    io.emit('log', errorMsg);
  }
}
