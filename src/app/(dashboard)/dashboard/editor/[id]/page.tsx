import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Editor from './Editor';

export default async function EditorPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = createServerComponentClient({ cookies });

  // 로그인 체크
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // 프로젝트 데이터 조회
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!project) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Editor project={project} userId={session.user.id} />
    </div>
  );
} 