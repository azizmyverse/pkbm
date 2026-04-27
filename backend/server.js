/* eslint-disable no-console */
require('dotenv').config();

const app = require('./app');
const prisma = require('./src/lib/prisma');

const PORT = Number(process.env.PORT) || 5000;

let server;

async function start() {
  try {
    await prisma.$connect();
    console.log('✅ Prisma terhubung ke database');

    server = app.listen(PORT, () => {
      console.log(`🚀 Server PKBM MUGI SAE berjalan di port ${PORT}`);
      console.log(`   Mode      : ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Frontend  : ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`   API base  : http://localhost:${PORT}/api/v1`);
    });
  } catch (err) {
    console.error('❌ Gagal menjalankan server:', err);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\n📦 Menerima ${signal}, menghentikan server...`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await prisma.$disconnect().catch(() => {});
  console.log('👋 Server berhenti dengan rapi');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

start();
