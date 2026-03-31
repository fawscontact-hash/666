import { restartCompetition } from '@/lib/services/demoCompetitionService';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const result = await restartCompetition();
    return NextResponse.json(result);
  } catch (err) {
    console.error('Restart competition error:', err);
    return NextResponse.json({ error: 'Restart failed' }, { status: 500 });
  }
}
