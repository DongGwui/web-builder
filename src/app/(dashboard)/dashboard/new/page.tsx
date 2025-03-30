import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CreateProjectForm from './CreateProjectForm';

export default async function NewProjectPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">새 프로젝트 만들기</h1>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <CreateProjectForm userId={user.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 