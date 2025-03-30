import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import os from 'os';
import { createClient } from '@/lib/supabase/server';
import type { ComponentFile } from '@/lib/projectGenerator';

// 24시간 후 만료
const PREVIEW_EXPIRY = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    // 1. 인증 확인
    const supabase = createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 2. 요청 데이터 파싱
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: '잘못된 요청입니다.' },
        { status: 400 }
      );
    }

    // 3. 프로젝트 데이터 조회
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (project.user_id !== session.user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 4. 임시 디렉토리 생성
    const previewDir = join(os.tmpdir(), 'web-builder-previews', projectId);
    await mkdir(previewDir, { recursive: true });

    // 5. 컴포넌트 파일 생성
    const components = project.components as ComponentFile[];
    for (const component of components) {
      const filePath = join(previewDir, component.name);
      await writeFile(filePath, component.content);
    }

    // 6. 프리뷰 URL 생성 (실제 구현에서는 적절한 프리뷰 서버 URL을 반환)
    const previewUrl = `/preview/${projectId}`;

    return NextResponse.json({
      message: '프리뷰가 생성되었습니다.',
      previewUrl,
      expiresAt: new Date(Date.now() + PREVIEW_EXPIRY).toISOString()
    });
  } catch (error) {
    console.error('Preview creation error:', error);
    return NextResponse.json(
      { error: '프리뷰 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 