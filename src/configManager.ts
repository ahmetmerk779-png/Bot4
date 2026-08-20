import * as fs from 'fs';
import * as path from 'path';

export interface BotConfig {
  host: string;
  port: number;
  username: string;
  version: string;
  ownerName: string;
}

const CONFIG_PATH = path.join(__dirname, '../config.json');
const MEMORY_PATH = path.join(__dirname, '../memory.json');

// Varsayılan konfigürasyon (Web panelinden güncellenebilir)
export function loadConfig(): BotConfig {
  if (fs.existsSync(CONFIG_PATH)) {
    const rawData = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(rawData);
  }
  
  const defaultConfig: BotConfig = {
    host: 'localhost',
    port: 25565,
    username: 'OtonomBot',
    version: '1.21.11',
    ownerName: 'SahipKullanici'
  };
  
  saveConfig(defaultConfig);
  return defaultConfig;
}

export function saveConfig(newConfig: BotConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf-8');
}

// Bellek ve Öğrenme Altyapısı (memory.json)
export function loadMemory(): any {
  if (fs.existsSync(MEMORY_PATH)) {
    const rawData = fs.readFileSync(MEMORY_PATH, 'utf-8');
    return JSON.parse(rawData);
  }
  
  const defaultMemory = {
    learnedRecipes: {},
    knownLocations: {},
    skills: []
  };
  
  fs.writeFileSync(MEMORY_PATH, JSON.stringify(defaultMemory, null, 2), 'utf-8');
  return defaultMemory;
}

export function updateMemory(key: string, data: any): void {
  const memory = loadMemory();
  memory[key] = data;
  fs.writeFileSync(MEMORY_PATH, JSON.stringify(memory, null, 2), 'utf-8');
}
