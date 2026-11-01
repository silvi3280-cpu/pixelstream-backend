const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const tmi = require('tmi.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Бизнес променливи на играта и уиджетите
let bossHealth = 100;
let subscriberGoal = 42; 
const targetChannel = 'lirik'; // Тестов глобален канал

// Сервиране на визуалния екран (Овърлея) към OBS
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'overlay.html'));
});

// 🟣 СВЪРЗВАНЕ С ЧАТА НА TWITCH
const client = new tmi.Client({
    channels: [targetChannel]
});
client.connect().catch(console.error);

console.log(`📡 PixelStream Studio: Слушам чата на канал [ ${targetChannel} ]`);

client.on('message', (channel, tags, message, self) => {
    if (self) return;
    const msg = message.trim().toLowerCase();

    // 🕹️ ЛОГИКА ЗА ЧАТ ИГРАТА: !attack
    if (msg === '!attack') {
        bossHealth -= 10;
        if (bossHealth < 0) bossHealth = 100; // Рестарт при победа
        
        console.log(`💥 Атака от ${tags['display-name']}! Босът е на ${bossHealth}% HP`);
        
        // Пращане на сигнал на живо към екрана в OBS
        io.emit('boss_update', { 
            attacker: tags['display-name'], 
            health: bossHealth 
        });
    }

    // 🔮 ЛОГИКА ЗА СМАРТ ДЖАДЖАТА: !sub (Симулация на абонамент за теста)
    if (msg === '!sub') {
        subscriberGoal += 1;
        if (subscriberGoal > 100) subscriberGoal = 42;
        
        console.log(`🎯 Нов абонат! Прогрес на целта: ${subscriberGoal}/100`);
        
        // Обновяване на уиджета в OBS на живо
        io.emit('goal_update', { 
            current: subscriberGoal 
        });
    }
});

// Стартиране на софтуерната инфраструктура
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 PixelStream Сървърът работи на порт: ${PORT}`);
});
