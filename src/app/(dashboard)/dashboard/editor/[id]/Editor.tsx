'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { ProjectSettings, ComponentFile } from '@/lib/projectGenerator';
import dynamic from 'next/dynamic';
import HotReload from '@/components/HotReload';

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

interface ComponentConfig {
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    backgroundImage?: string;
  };
  about: {
    title: string;
    description: string;
    features: Array<{
      title: string;
      description: string;
      icon?: string;
    }>;
  };
  projects: {
    title: string;
    description: string;
    items: Array<{
      title: string;
      description: string;
      image?: string;
      link?: string;
    }>;
  };
  contact: {
    title: string;
    description: string;
    email?: string;
    phone?: string;
    address?: string;
    socialLinks?: Array<{
      platform: string;
      url: string;
    }>;
  };
}

interface Feature {
  title: string;
  description: string;
  icon?: string;
}

interface ProjectItem {
  title: string;
  description: string;
  image?: string;
  link?: string;
}

export default function Editor({ project, userId }: EditorProps) {
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [editingComponent, setEditingComponent] = useState<ComponentFile | null>(null);
  const [componentConfig, setComponentConfig] = useState<Partial<ComponentConfig>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [components, setComponents] = useState<ComponentFile[]>(project.components);
  const [editMode, setEditMode] = useState<'visual' | 'code'>('visual');
  const [sections] = useState<string[]>(project.settings.sections);

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
    const updatedComponent = {
      ...editingComponent,
      content: value
    };
    setEditingComponent(updatedComponent);
    
    // 실시간 프리뷰를 위해 components 상태 업데이트
    setComponents(prev => 
      prev.map((comp: ComponentFile) => comp.name === updatedComponent.name ? updatedComponent : comp)
    );
  };

  // 컴포넌트 코드 생성
  const generateComponentCode = (type: keyof ComponentConfig, config: any) => {
    let code = '';
    switch (type) {
      case 'hero':
        code = `
          return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="section-title">${config.title}</h1>
              <p className="text-xl mb-8">${config.subtitle}</p>
              <button className="button">${config.ctaText}</button>
              ${config.backgroundImage ? `<img src="${config.backgroundImage}" alt="배경" className="absolute inset-0 w-full h-full object-cover -z-10" />` : ''}
            </div>
          );
        `;
        break;
      case 'about':
        code = `
          return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="section-title">${config.title}</h2>
              <p className="text-lg mb-12">${config.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                ${config.features.map(feature => `
                  <div className="card p-6">
                    ${feature.icon ? `<div className="text-3xl mb-4">${feature.icon}</div>` : ''}
                    <h3 className="text-xl font-semibold mb-4">${feature.title}</h3>
                    <p className="text-gray-600">${feature.description}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          );
        `;
        break;
      // 다른 컴포넌트 타입에 대한 코드 생성 로직 추가
    }
    return code.trim();
  };

  // 컴포넌트 설정 업데이트
  const handleConfigChange = (type: keyof ComponentConfig, newConfig: any) => {
    setComponentConfig(prev => ({
      ...prev,
      [type]: newConfig
    }));

    // 새로운 코드 생성 및 컴포넌트 업데이트
    const newCode = generateComponentCode(type, newConfig);
    const updatedComponent = {
      ...editingComponent!,
      content: newCode
    };
    
    setEditingComponent(updatedComponent);
    setComponents(prev => 
      prev.map((comp: ComponentFile) => comp.name === updatedComponent.name ? updatedComponent : comp)
    );
  };

  // 컴포넌트 수정사항 저장
  const handleSave = async () => {
    if (!editingComponent) return;

    try {
      setIsLoading(true);
      setError(null);

      // Supabase에 저장
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          components: components
        })
        .eq('id', project.id);

      if (updateError) throw updateError;

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

  // about 섹션의 특징 렌더링
  const renderFeatures = (aboutConfig: ComponentConfig['about']) => {
    return (
      <div className="space-y-2">
        {(aboutConfig.features || []).map((feature: Feature, index: number) => (
          <div
            key={`feature-${index}`}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">특징 {index + 1}</span>
            </div>
            <input
              type="text"
              value={feature.title || ''}
              onChange={e => {
                const newFeatures = [...(aboutConfig.features || [])];
                newFeatures[index] = { ...feature, title: e.target.value };
                handleConfigChange('about', { ...aboutConfig, features: newFeatures });
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="특징 제목"
            />
            <textarea
              value={feature.description || ''}
              onChange={e => {
                const newFeatures = [...(aboutConfig.features || [])];
                newFeatures[index] = { ...feature, description: e.target.value };
                handleConfigChange('about', { ...aboutConfig, features: newFeatures });
              }}
              className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="특징 설명"
              rows={2}
            />
          </div>
        ))}
      </div>
    );
  };

  // 컴포넌트 편집 UI 렌더링
  const renderEditForm = (type: keyof ComponentConfig) => {
    const config = componentConfig[type] || {};
    
    switch (type) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">제목</label>
              <input
                type="text"
                value={(config as any).title || ''}
                onChange={e => handleConfigChange(type, { ...config, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">부제목</label>
              <input
                type="text"
                value={(config as any).subtitle || ''}
                onChange={e => handleConfigChange(type, { ...config, subtitle: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">버튼 텍스트</label>
              <input
                type="text"
                value={(config as any).ctaText || ''}
                onChange={e => handleConfigChange(type, { ...config, ctaText: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        );
      case 'about':
        const aboutConfig = config as ComponentConfig['about'];
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">제목</label>
              <input
                type="text"
                value={aboutConfig.title || ''}
                onChange={e => handleConfigChange(type, { ...aboutConfig, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">설명</label>
              <textarea
                value={aboutConfig.description || ''}
                onChange={e => handleConfigChange(type, { ...aboutConfig, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">특징</label>
              {renderFeatures(aboutConfig)}
              <button
                type="button"
                onClick={() => {
                  const newFeatures = [...(aboutConfig.features || []), { title: '', description: '' }];
                  handleConfigChange(type, { ...aboutConfig, features: newFeatures });
                }}
                className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                특징 추가
              </button>
            </div>
          </div>
        );
      // 다른 컴포넌트 타입에 대한 폼 추가
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
      </div>

      {/* 편집기와 프리뷰 */}
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
                    onClick={() => setEditMode(editMode === 'visual' ? 'code' : 'visual')}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {editMode === 'visual' ? '코드 편집' : '비주얼 편집'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingComponent(null);
                      setComponents(project.components);
                    }}
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
              
              {editMode === 'visual' ? (
                renderEditForm(editingComponent.name.split('.')[0] as keyof ComponentConfig)
              ) : (
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
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section, index) => {
                const [sectionId] = section.split(':');
                const option = getSectionOption(sectionId);
                const component = components.find(c => c.name.startsWith(`${sectionId}.`));
                
                return (
                  <div
                    key={section}
                    className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        {sectionId} ({option})
                      </h3>
                    </div>
                    {component && (
                      <div className="mt-4">
                        <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-gray-50 p-4 text-sm text-gray-600">
                          {component.content}
                        </pre>
                      </div>
                    )}
                    <button
                      className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      onClick={() => {
                        const type = sectionId as keyof ComponentConfig;
                        setEditMode('visual');
                        setEditingComponent(component || null);
                        setComponentConfig({
                          [type]: {
                            title: '',
                            subtitle: '',
                            ctaText: '',
                          }
                        });
                      }}
                    >
                      편집
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 오른쪽: 실시간 프리뷰 */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="h-[800px] overflow-hidden rounded-lg">
            <HotReload 
              key={project.id}
              components={components} 
              settings={project.settings}
            />
          </div>
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