'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { ProjectSettings, ComponentFile } from '@/lib/projectGenerator';
import dynamic from 'next/dynamic';

// Monaco 에디터를 동적으로 불러오기
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />
});

interface Project {
  id: string;
  name: string;
  description: string;
  settings: ProjectSettings;
  components: ComponentFile[];
  content: {
    structure: string;
  };
}

interface EditorProps {
  project: Project;
  userId: string;
}

export default function Editor({ project, userId }: EditorProps) {
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [editingComponent, setEditingComponent] = useState<ComponentFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 선택된 섹션의 스타일 옵션 가져오기
  const getSectionOption = (sectionId: string) => {
    const [, optionId] = project.settings.sections
      .find(s => s.startsWith(sectionId + ':'))
      ?.split(':') || [];
    return optionId;
  };

  // 컴포넌트 코드 수정 처리
  const handleCodeChange = (value: string | undefined) => {
    if (!editingComponent || !value) return;
    setEditingComponent({
      ...editingComponent,
      content: value
    });
  };

  // 컴포넌트 수정사항 저장
  const handleSave = async () => {
    if (!editingComponent) return;

    try {
      setIsLoading(true);
      setError(null);

      // 현재 프로젝트의 components 배열 업데이트
      const updatedComponents = project.components.map(comp =>
        comp.name === editingComponent.name ? editingComponent : comp
      );

      // Supabase에 저장
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          components: updatedComponents
        })
        .eq('id', project.id);

      if (updateError) throw updateError;

      // 프로젝트 객체 업데이트
      project.components = updatedComponents;
      
      // 편집 모드 종료
      setEditingComponent(null);
      setCurrentSection(null);
    } catch (err) {
      console.error('Failed to save component:', err);
      setError('컴포넌트 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 프리뷰 생성
  const handlePreview = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/projects/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id
        })
      });

      if (!response.ok) {
        throw new Error('프리뷰 생성에 실패했습니다.');
      }

      const data = await response.json();
      setPreviewUrl(data.previewUrl);
      setShowPreview(true);
    } catch (err) {
      console.error('Preview generation error:', err);
      setError('프리뷰 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="mt-2 text-gray-600">{project.description}</p>
        </div>
        <button
          onClick={handlePreview}
          disabled={isLoading}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? '로딩 중...' : '프리뷰'}
        </button>
      </div>

      {/* 편집기 / 섹션 목록 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 왼쪽: 섹션 목록 또는 편집기 */}
        <div className="space-y-6">
          {editingComponent ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingComponent.name} 편집
                </h3>
                <div className="space-x-2">
                  <button
                    onClick={() => setEditingComponent(null)}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    저장
                  </button>
                </div>
              </div>
              <MonacoEditor
                height="500px"
                language="typescript"
                theme="vs-dark"
                value={editingComponent.content}
                onChange={handleCodeChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            </div>
          ) : (
            project.settings.sections.map(section => {
              const [sectionId] = section.split(':');
              const option = getSectionOption(sectionId);
              const component = project.components.find(c => c.name.startsWith(`${sectionId}.`));
              
              return (
                <div
                  key={section}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-lg font-medium text-gray-900">
                    {sectionId} ({option})
                  </h3>
                  {component && (
                    <div className="mt-4">
                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-gray-50 p-4 text-sm text-gray-600">
                        {component.content}
                      </pre>
                    </div>
                  )}
                  <button
                    className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    onClick={() => component && setEditingComponent(component)}
                  >
                    편집
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* 오른쪽: 프리뷰 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-medium text-gray-900">프리뷰</h3>
          {showPreview && previewUrl ? (
            <iframe
              src={previewUrl}
              className="h-[800px] w-full rounded-md border border-gray-200"
              title="프리뷰"
            />
          ) : (
            <div className="flex h-[800px] items-center justify-center rounded-md border border-gray-200 bg-gray-50">
              <p className="text-gray-500">프리뷰를 생성하려면 상단의 프리뷰 버튼을 클릭하세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">오류</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 