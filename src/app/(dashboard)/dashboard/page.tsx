import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {user.user_metadata.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.full_name}
                  className="h-10 w-10 rounded-full"
                />
              )}
              <div className="ml-3">
                <h1 className="text-2xl font-semibold text-gray-900">{user.user_metadata.full_name}님의 대시보드</h1>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 mt-8">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">내 프로젝트</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  href="/dashboard/new"
                  className="relative flex items-center space-x-3 rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 hover:border-gray-400 focus:outline-none"
                >
                  <div className="flex-shrink-0">
                    <PlusIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="focus:outline-none">
                      <p className="text-sm font-medium text-gray-900">새 프로젝트 만들기</p>
                      <p className="truncate text-sm text-gray-500">AI의 도움을 받아 새로운 웹사이트를 만들어보세요</p>
                    </div>
                  </div>
                </Link>

                {projects?.map((project: Project) => (
                  <Link
                    key={project.id}
                    href={`/dashboard/editor/${project.id}`}
                    className="relative flex flex-col rounded-lg border border-gray-300 bg-white p-6 hover:border-gray-400 focus:outline-none"
                  >
                    <div className="flex-1">
                      <div className="focus:outline-none">
                        <p className="text-sm font-medium text-gray-900">{project.name}</p>
                        {project.description && (
                          <p className="mt-1 truncate text-sm text-gray-500">{project.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs text-gray-500">
                        {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 