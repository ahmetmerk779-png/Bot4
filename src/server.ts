import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import * as path from 'path';
import { loadConfig, saveConfig, loadMemory } from './configManager';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Web panelinden mevcut konfigürasyonu çekme endpoint'i
app.get('/api/config', (req, res) => {
  const config = loadConfig();
  res.json(config);
});

// Web panelinden konfigürasyonu güncellem e endpoint'i
app.post('/api/config', (req, res) => {
  try {
    const newConfig = req.body;
    saveConfig(newConfig);
    res.json({ success: true, message: 'Konfigürasyon başarıyla güncellendi!' });
    
    // Bağlı olan tüm web panellerine bilgi ver
    io.emit('configUpdated', newConfig);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Konfigürasyon güncellenemedi.' });
  }
});

// Bot hafızasını (memory.json) web panelinde görüntüleme endpoint'i
app.get('/api/memory', (req, res) => {
  const memory = loadMemory();
  res.json(memory);
});

// WebSocket Bağlantı Yönetimi (Canlı Terminal ve Radar için)
io.on('connection', (socket) => {
  console.log('[WEB PANEL] Bir kullanıcı panele bağlandı.');

  socket.emit('log', 'Web paneline başarıyla bağlanıldı. Bot verileri akışı aktif.');

  socket.on('disconnect', () => {
    console.log('[WEB PANEL] Kullanıcı bağlantısı kesildi.');
  });
});

// Sunucuyu başlatma
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[SUNUCU] Web Paneli ve WebSocket sunucusu ${PORT} portunda çalışıyor.`);
});

export { io };
