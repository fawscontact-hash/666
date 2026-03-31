import { getLeaderboard, getCompetition } from '@/lib/services/demoCompetitionService';
import { NextResponse } from 'next/server';

export const revalidate = 60; // cache 60 seconds

export async function GET() {
  try {
    const [leaderboard, competition] = await Promise.all([
      getLeaderboard(20),
      getCompetition(),
    ]);
    return NextResponse.json({ leaderboard, competition });
  } catch (err) {
    console.error('Demo summary error:', err);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
