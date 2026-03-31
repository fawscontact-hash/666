import { resetDailyStats } from '@/lib/services/demoCompetitionService';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await resetDailyStats();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Reset daily error:', err);
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
  }
}
