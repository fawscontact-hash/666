import { toggleCompetition } from '@/lib/services/demoCompetitionService';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { isEnabled } = await req.json();
    const result = await toggleCompetition(Boolean(isEnabled));
    return NextResponse.json(result);
  } catch (err) {
    console.error('Toggle competition error:', err);
    return NextResponse.json({ error: 'Toggle failed' }, { status: 500 });
  }
}
