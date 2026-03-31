import { generateDemoAffiliates } from '@/lib/services/demoCompetitionService';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body  = await req.json().catch(() => ({}));
    const count = Math.min(Math.max(parseInt(body.count) || 75, 10), 100);
    const result = await generateDemoAffiliates(count);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Generate demo affiliates error:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
