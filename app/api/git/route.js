import { NextResponse } from 'next/server';
import { getGitInfo, executeGitAction } from '@/lib/git';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const gitInfo = getGitInfo();
    return NextResponse.json(gitInfo, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err?.message || 'Impossibile recuperare le informazioni Git.',
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, name, message } = body;

    const result = executeGitAction(action, { name, message });
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    const updatedGitInfo = getGitInfo();
    return NextResponse.json({
      ...result,
      gitInfo: updatedGitInfo,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: `Errore nella richiesta: ${err?.message || err}`,
      },
      { status: 500 }
    );
  }
}
