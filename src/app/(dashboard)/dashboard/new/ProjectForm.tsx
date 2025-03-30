'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

interface ProjectFormProps {
  userId: string;
}

export default function ProjectForm({ userId }: ProjectFormProps) {
  const router = useRouter();
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('User check:', { 
        user,
        error,
        userId: user?.id,
        providedUserId: userId
      });
    };
    checkSession();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('인증 세션이 만료되었습니다. 다시 로그인해주세요.');
      }

      console.log('Current user:', {
        user,
        userId: user.id,
        providedUserId: userId
      });

      const { data: project, error: insertError } = await supabase
        .from('projects')
        .insert([
          {
            name: projectName,
            description: description,
            user_id: user.id, // userId 대신 현재 인증된 사용자의 ID 사용
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      router.push(`/dashboard/editor/${project.id}`);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : '프로젝트 생성 중 오류가 발생했습니다.');
      
      if (err instanceof Error && err.message.includes('인증 세션')) {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">오류</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="project-name" className="block text-sm font-medium text-gray-700">
            프로젝트 이름
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="project-name"
              id="project-name"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            설명
          </label>
          <div className="mt-1">
            <textarea
              id="description"
              name="description"
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            프로젝트에 대한 간단한 설명을 입력해주세요.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="mr-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            취소
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={isLoading}
          >
            {isLoading ? '생성 중...' : '프로젝트 생성'}
          </button>
        </div>
      </form>
    </>
  );
} 