import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma  = new PrismaClient({ adapter });

const hashed = await bcrypt.hash('demo123', 10);

const aff = await prisma.affiliate.upsert({
  where:  { username: 'demo' },
  update: { password: hashed, name: 'Demo Affilié', isActive: true },
  create: {
    username:       'demo',
    name:           'Demo Affilié',
    password:       hashed,
    commissionRate: 0.1,
    isActive:       true,
  },
});

console.log('✅ Demo affiliate created:');
console.log('   Username:', aff.username);
console.log('   Password: demo123');
console.log('   Login at: http://localhost:3000/affiliate/login');

await prisma.$disconnect();
