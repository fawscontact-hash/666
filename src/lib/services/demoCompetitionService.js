/**
 * src/lib/services/demoCompetitionService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Demo Competition — core logic:
 *   • generate()   → seed 50-100 fake affiliates
 *   • simulate()   → advance stats one tick (called by cron)
 *   • getLeaderboard() → ranked summary for the home leaderboard
 *   • getDetails() → full stats + earnings history for popup
 *   • restart()    → reset all demo stats + create new competition
 *   • getCompetition() → current competition config
 *   • setSpeed()   → update simulation speed
 *   • toggle()     → enable / disable
 * ─────────────────────────────────────────────────────────────────────────────
 */

import prisma from '../prisma.js';

// ── Moroccan names pool ────────────────────────────────────────────────────────
const FIRST_NAMES = [
  'Youssef','Hamza','Mehdi','Ayoub','Imad','Rachid','Bilal','Khalid',
  'Mourad','Samir','Tariq','Amine','Hicham','Nabil','Soufiane',
  'Fatima','Meryem','Zineb','Nadia','Samira','Khadija','Hajar',
  'Loubna','Sanae','Houda','Laila','Sana','Ghita','Widad','Amina',
];
const LAST_NAMES = [
  'Benali','El Idrissi','Moussaoui','Berrada','Tazi','Bensouda',
  'El Fassi','Lahlou','Chraibi','Alaoui','El Amrani','Benkiran',
  'Ziani','Ouali','Benkirane','Hajji','Nassiri','Saidi','Hilali',
];

const BADGES = ['Top Performer', 'Fast Growing', 'Consistent', 'Rising Star', 'Power Seller'];
const GROWTH_STYLES = ['aggressive', 'consistent', 'slow'];
const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=',
];

function randomName() {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last  = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

function randomUsername(name, idx) {
  return `${name.split(' ')[0].toLowerCase()}${idx}`;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

// Growth multipliers per style
const GROWTH = {
  aggressive: { ordersPerTick: [5, 20], revenuePerOrder: [150, 600], cancelRate: 0.05 },
  consistent: { ordersPerTick: [2, 8],  revenuePerOrder: [100, 400], cancelRate: 0.08 },
  slow:       { ordersPerTick: [0, 4],  revenuePerOrder: [80,  300], cancelRate: 0.12 },
};

// Speed multipliers
const SPEED_MULT = { slow: 0.4, medium: 1, fast: 2.5 };

// ── generate ─────────────────────────────────────────────────────────────────

export async function generateDemoAffiliates(count = 75) {
  // Clear existing
  await prisma.demoEarningsHistory.deleteMany();
  await prisma.demoAffiliateStats.deleteMany();
  await prisma.demoAffiliate.deleteMany();

  const affiliates = [];
  for (let i = 0; i < count; i++) {
    const name        = randomName();
    const username    = randomUsername(name, i + 1);
    const growthStyle = GROWTH_STYLES[i % GROWTH_STYLES.length];
    const badge       = BADGES[Math.floor(Math.random() * BADGES.length)];
    const followers   = rand(500, 50000);

    affiliates.push({
      name,
      username,
      avatarUrl: `${AVATARS[0]}${username}`,
      followers,
      growthStyle,
      badge,
    });
  }

  // Batch create affiliates
  await prisma.demoAffiliate.createMany({ data: affiliates });

  // Fetch created to get IDs
  const created = await prisma.demoAffiliate.findMany();

  // Seed initial stats (30 days of back-history)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const statsData   = [];
  const historyData = [];

  for (const aff of created) {
    const g = GROWTH[aff.growthStyle];
    let cumOrders  = 0;
    let cumRevenue = 0;

    // Generate 30 days of history
    for (let d = 29; d >= 0; d--) {
      const date   = new Date(today);
      date.setDate(date.getDate() - d);

      const dayOrders  = rand(...g.ordersPerTick) * rand(2, 5);
      const dayRevenue = dayOrders * randFloat(...g.revenuePerOrder);
      const commission = dayRevenue * 0.05;

      cumOrders  += dayOrders;
      cumRevenue += dayRevenue;

      historyData.push({
        demoAffiliateId: aff.id,
        date,
        orders:     dayOrders,
        revenue:    parseFloat(dayRevenue.toFixed(2)),
        commission: parseFloat(commission.toFixed(2)),
      });
    }

    const cancelledOrders  = Math.floor(cumOrders * g.cancelRate);
    const confirmedOrders  = cumOrders - cancelledOrders;
    const teamSize         = rand(3, 20);
    const teamOrders       = Math.floor(cumOrders * randFloat(0.2, 0.6));
    const teamRevenue      = teamOrders * randFloat(80, 300);
    const teamCommission   = teamRevenue * 0.05;

    statsData.push({
      demoAffiliateId: aff.id,
      totalOrders:    cumOrders,
      confirmedOrders,
      cancelledOrders,
      totalRevenue:   parseFloat(cumRevenue.toFixed(2)),
      teamSize,
      teamOrders,
      teamRevenue:    parseFloat(teamRevenue.toFixed(2)),
      teamCommission: parseFloat(teamCommission.toFixed(2)),
      todayOrders:    rand(...g.ordersPerTick),
      todayRevenue:   parseFloat((rand(...g.ordersPerTick) * randFloat(...g.revenuePerOrder)).toFixed(2)),
      lastHourOrders: rand(0, 3),
    });
  }

  // Batch insert
  await prisma.demoAffiliateStats.createMany({ data: statsData });
  // Insert history in chunks (avoid query size limits)
  const CHUNK = 200;
  for (let i = 0; i < historyData.length; i += CHUNK) {
    await prisma.demoEarningsHistory.createMany({ data: historyData.slice(i, i + CHUNK) });
  }

  // Update ranks
  await _updateRanks();

  // Create / reset competition
  await prisma.demoCompetition.deleteMany();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  await prisma.demoCompetition.create({
    data: { isEnabled: true, speed: 'medium', endDate },
  });

  return { count: created.length };
}

// ── simulate (one tick) ───────────────────────────────────────────────────────

export async function simulateTick() {
  const competition = await prisma.demoCompetition.findFirst();
  if (!competition?.isEnabled) return { skipped: true };

  const mult = SPEED_MULT[competition.speed] ?? 1;

  const affiliates = await prisma.demoAffiliate.findMany({
    where: { isActive: true },
    include: { stats: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const aff of affiliates) {
    if (!aff.stats) continue;
    const g = GROWTH[aff.growthStyle];

    const newOrders  = Math.round(rand(...g.ordersPerTick) * mult);
    const revenue    = newOrders * randFloat(...g.revenuePerOrder);
    const cancelled  = Math.floor(newOrders * g.cancelRate);
    const confirmed  = newOrders - cancelled;

    const teamNewOrders  = Math.floor(newOrders * randFloat(0.1, 0.3));
    const teamNewRevenue = teamNewOrders * randFloat(80, 300);

    // Update cumulative stats
    await prisma.demoAffiliateStats.update({
      where: { demoAffiliateId: aff.id },
      data: {
        totalOrders:    { increment: newOrders },
        confirmedOrders:{ increment: confirmed },
        cancelledOrders:{ increment: cancelled },
        totalRevenue:   { increment: parseFloat(revenue.toFixed(2)) },
        teamOrders:     { increment: teamNewOrders },
        teamRevenue:    { increment: parseFloat(teamNewRevenue.toFixed(2)) },
        teamCommission: { increment: parseFloat((teamNewRevenue * 0.05).toFixed(2)) },
        todayOrders:    { increment: newOrders },
        todayRevenue:   { increment: parseFloat(revenue.toFixed(2)) },
        lastHourOrders: rand(0, Math.ceil(mult * 2)),
      },
    });

    // Upsert today's earnings history
    await prisma.demoEarningsHistory.upsert({
      where:  { demoAffiliateId_date: { demoAffiliateId: aff.id, date: today } },
      update: {
        orders:     { increment: newOrders },
        revenue:    { increment: parseFloat(revenue.toFixed(2)) },
        commission: { increment: parseFloat((revenue * 0.05).toFixed(2)) },
      },
      create: {
        demoAffiliateId: aff.id,
        date:       today,
        orders:     newOrders,
        revenue:    parseFloat(revenue.toFixed(2)),
        commission: parseFloat((revenue * 0.05).toFixed(2)),
      },
    });
  }

  await _updateRanks();

  // Reset todayOrders at midnight (if competition day changed)
  await _maybeResetDailyStats();

  return { ticked: affiliates.length };
}

async function _updateRanks() {
  const ranked = await prisma.demoAffiliateStats.findMany({
    orderBy: { totalOrders: 'desc' },
    select:  { id: true },
  });
  for (let i = 0; i < ranked.length; i++) {
    await prisma.demoAffiliateStats.update({
      where: { id: ranked[i].id },
      data:  { rank: i + 1 },
    });
  }
}

async function _maybeResetDailyStats() {
  // Reset todayOrders/todayRevenue if the last update was yesterday
  // (Simple approach: the cron resets at midnight via a separate endpoint)
}

// ── getLeaderboard ────────────────────────────────────────────────────────────

export async function getLeaderboard(limit = 20) {
  const stats = await prisma.demoAffiliateStats.findMany({
    orderBy: { totalOrders: 'desc' },
    take:    limit,
    include: {
      demoAffiliate: {
        select: { id: true, name: true, username: true, avatarUrl: true, badge: true, followers: true, growthStyle: true },
      },
    },
  });

  return stats.map((s, idx) => ({
    rank:           idx + 1,
    id:             s.demoAffiliate.id,
    name:           s.demoAffiliate.name,
    username:       s.demoAffiliate.username,
    avatarUrl:      s.demoAffiliate.avatarUrl,
    badge:          s.demoAffiliate.badge,
    followers:      s.demoAffiliate.followers,
    growthStyle:    s.demoAffiliate.growthStyle,
    totalOrders:    s.totalOrders,
    totalRevenue:   s.totalRevenue,
    confirmedOrders:s.confirmedOrders,
    cancelledOrders:s.cancelledOrders,
    todayOrders:    s.todayOrders,
    todayRevenue:   s.todayRevenue,
    lastHourOrders: s.lastHourOrders,
    teamSize:       s.teamSize,
  }));
}

// ── getDetails ────────────────────────────────────────────────────────────────

export async function getDemoAffiliateDetails(id) {
  const aff = await prisma.demoAffiliate.findUnique({
    where:   { id },
    include: {
      stats: true,
      earningsHistory: {
        orderBy: { date: 'desc' },
        take:    30,
      },
    },
  });

  if (!aff) return null;

  return {
    id:             aff.id,
    name:           aff.name,
    username:       aff.username,
    avatarUrl:      aff.avatarUrl,
    badge:          aff.badge,
    followers:      aff.followers,
    growthStyle:    aff.growthStyle,
    rank:           aff.stats?.rank ?? 0,
    stats: {
      totalOrders:    aff.stats?.totalOrders    ?? 0,
      confirmedOrders:aff.stats?.confirmedOrders ?? 0,
      cancelledOrders:aff.stats?.cancelledOrders ?? 0,
      totalRevenue:   aff.stats?.totalRevenue    ?? 0,
      todayOrders:    aff.stats?.todayOrders     ?? 0,
      todayRevenue:   aff.stats?.todayRevenue    ?? 0,
      lastHourOrders: aff.stats?.lastHourOrders  ?? 0,
      teamSize:       aff.stats?.teamSize        ?? 0,
      teamOrders:     aff.stats?.teamOrders      ?? 0,
      teamRevenue:    aff.stats?.teamRevenue      ?? 0,
      teamCommission: aff.stats?.teamCommission   ?? 0,
    },
    earningsHistory: aff.earningsHistory.map(h => ({
      date:       h.date,
      orders:     h.orders,
      revenue:    h.revenue,
      commission: h.commission,
    })),
  };
}

// ── admin helpers ─────────────────────────────────────────────────────────────

export async function getCompetition() {
  return prisma.demoCompetition.findFirst();
}

export async function toggleCompetition(isEnabled) {
  const comp = await prisma.demoCompetition.findFirst();
  if (!comp) return null;
  return prisma.demoCompetition.update({
    where: { id: comp.id },
    data:  { isEnabled },
  });
}

export async function setSpeed(speed) {
  const comp = await prisma.demoCompetition.findFirst();
  if (!comp) return null;
  return prisma.demoCompetition.update({
    where: { id: comp.id },
    data:  { speed },
  });
}

export async function restartCompetition() {
  // Reset all stats to zero
  await prisma.demoEarningsHistory.deleteMany();
  await prisma.demoAffiliateStats.updateMany({
    data: {
      totalOrders:    0,
      confirmedOrders:0,
      cancelledOrders:0,
      totalRevenue:   0,
      teamOrders:     0,
      teamRevenue:    0,
      teamCommission: 0,
      todayOrders:    0,
      todayRevenue:   0,
      lastHourOrders: 0,
      rank:           0,
    },
  });

  // Update competition dates
  const comp = await prisma.demoCompetition.findFirst();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  if (comp) {
    return prisma.demoCompetition.update({
      where: { id: comp.id },
      data:  { startDate: new Date(), endDate },
    });
  }
  return prisma.demoCompetition.create({
    data: { isEnabled: true, speed: 'medium', endDate },
  });
}

export async function resetDailyStats() {
  await prisma.demoAffiliateStats.updateMany({
    data: { todayOrders: 0, todayRevenue: 0, lastHourOrders: 0 },
  });
}
