import { simulateTick } from '@/lib/services/demoCompetitionService';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const result = await simulateTick();
    return NextResponse.json(result);
  } catch (err) {
    console.error('Simulate tick error:', err);
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 });
  }
}
