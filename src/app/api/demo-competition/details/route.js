import { getDemoAffiliateDetails } from '@/lib/services/demoCompetitionService';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const details = await getDemoAffiliateDetails(id);
    if (!details) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(details);
  } catch (err) {
    console.error('Demo details error:', err);
    return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
  }
}
