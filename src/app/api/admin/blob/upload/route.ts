import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['application/zip', 'application/pdf'],
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {
        // No server-side action needed here — the caller (Task 22's ZIP
        // form, Task 23's replace-file action) explicitly processes the
        // resulting blob URL after `upload()` resolves.
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
