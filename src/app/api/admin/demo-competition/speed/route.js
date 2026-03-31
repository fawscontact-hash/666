import { setSpeed } from '@/lib/services/demoCompetitionService';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { speed } = await req.json();
    if (!['slow', 'medium', 'fast'].includes(speed)) {
      return NextResponse.json({ error: 'Invalid speed' }, { status: 400 });
    }
    const result = await setSpeed(speed);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Set speed error:', err);
    return NextResponse.json({ error: 'Speed update failed' }, { status: 500 });
  }
}
