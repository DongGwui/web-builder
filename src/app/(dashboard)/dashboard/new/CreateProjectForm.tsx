'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import ColorPreview from './ColorPreview';
import { generateContent, generateCode } from '@/lib/claude';
import { parseGeneratedCode } from '@/lib/projectGenerator';
import dynamic from 'next/dynamic';

// HotReload 컴포넌트를 동적으로 불러오기
const HotReload = dynamic(() => import('@/components/HotReload'), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
        <p className="text-sm text-gray-500">프리뷰 로딩 중...</p>
      </div>
    </div>
  )
});

// 서비스 타입 정의
const SERVICE_TYPES = [
  {
    id: 'personal-portfolio',
    name: '개인 포트폴리오',
    description: '자신의 작업물과 경력을 소개하는 페이지',
    examples: ['디자이너 포트폴리오', '개발자 포트폴리오', '작가 포트폴리오'],
    features: ['작업물 갤러리', '소개 섹션', '연락처', '이력 섹션']
  },
  {
    id: 'landing-page',
    name: '서비스 소개 페이지',
    description: '제품이나 서비스를 소개하는 랜딩 페이지',
    examples: ['앱 소개', '제품 출시', '이벤트 안내'],
    features: ['핵심 기능 소개', '가격 정보', '신청/구매 버튼', '문의하기']
  },
  {
    id: 'restaurant-menu',
    name: '식당 메뉴 페이지',
    description: '메뉴와 매장 정보를 소개하는 페이지',
    examples: ['카페', '레스토랑', '베이커리'],
    features: ['메뉴 목록', '가격표', '매장 위치', '영업 시간']
  }
];

// 페이지 스타일 옵션
const LAYOUT_OPTIONS = [
  { id: 'grid', name: '그리드형', description: '콘텐츠를 격자 형태로 배치' },
  { id: 'scroll', name: '스크롤형', description: '긴 페이지를 스크롤하며 콘텐츠 탐색' },
  { id: 'section', name: '섹션형', description: '구분된 섹션으로 콘텐츠 구성' }
];

const MOOD_OPTIONS = [
  { id: 'professional', name: '전문적인' },
  { id: 'modern', name: '모던한' },
  { id: 'minimal', name: '미니멀한' },
  { id: 'playful', name: '경쾌한' },
  { id: 'luxury', name: '고급스러운' },
  { id: 'casual', name: '캐주얼한' }
];

// 섹션 정의
const SECTIONS_BY_TYPE = {
  'personal-portfolio': [
    {
      id: 'hero',
      name: '메인 소개',
      description: '자신을 소개하는 메인 섹션',
      required: true,
      options: [
        { id: 'image-bg', name: '이미지 배경' },
        { id: 'gradient-bg', name: '그라데이션 배경' },
        { id: 'minimal', name: '미니멀' }
      ]
    },
    {
      id: 'about',
      name: '자기소개',
      description: '상세한 자기소개와 경력 사항',
      required: true,
      options: [
        { id: 'timeline', name: '타임라인형' },
        { id: 'card', name: '카드형' }
      ]
    },
    {
      id: 'projects',
      name: '프로젝트',
      description: '주요 프로젝트 목록',
      required: true,
      options: [
        { id: 'grid', name: '그리드형' },
        { id: 'masonry', name: '매스너리형' },
        { id: 'carousel', name: '캐러셀형' }
      ]
    },
    {
      id: 'skills',
      name: '기술/스킬',
      description: '보유한 기술과 스킬',
      required: false,
      options: [
        { id: 'tag', name: '태그형' },
        { id: 'progress', name: '진행바형' }
      ]
    },
    {
      id: 'contact',
      name: '연락처',
      description: '연락 가능한 방법들',
      required: true,
      options: [
        { id: 'simple', name: '심플형' },
        { id: 'form', name: '문의 폼 포함' }
      ]
    }
  ],
  'landing-page': [
    {
      id: 'hero',
      name: '메인 소개',
      description: '서비스의 핵심 가치를 소개',
      required: true,
      options: [
        { id: 'image-split', name: '이미지 분할형' },
        { id: 'centered', name: '중앙 정렬형' },
        { id: 'video-bg', name: '비디오 배경' }
      ]
    },
    {
      id: 'features',
      name: '주요 기능',
      description: '서비스의 주요 기능 소개',
      required: true,
      options: [
        { id: 'grid', name: '그리드형' },
        { id: 'list', name: '리스트형' },
        { id: 'timeline', name: '타임라인형' }
      ]
    },
    {
      id: 'pricing',
      name: '가격 정책',
      description: '서비스 요금제 안내',
      required: false,
      options: [
        { id: 'card', name: '카드형' },
        { id: 'table', name: '테이블형' }
      ]
    },
    {
      id: 'cta',
      name: '가입/신청',
      description: '서비스 신청 섹션',
      required: true,
      options: [
        { id: 'simple', name: '심플형' },
        { id: 'split', name: '분할형' }
      ]
    }
  ],
  'restaurant-menu': [
    {
      id: 'hero',
      name: '매장 소개',
      description: '매장 분위기와 특징 소개',
      required: true,
      options: [
        { id: 'image-gallery', name: '이미지 갤러리형' },
        { id: 'single-image', name: '단일 이미지형' }
      ]
    },
    {
      id: 'menu',
      name: '메뉴',
      description: '제공하는 메뉴 목록',
      required: true,
      options: [
        { id: 'grid', name: '그리드형' },
        { id: 'list', name: '리스트형' },
        { id: 'category', name: '카테고리형' }
      ]
    },
    {
      id: 'info',
      name: '매장 정보',
      description: '위치, 영업시간 등',
      required: true,
      options: [
        { id: 'simple', name: '심플형' },
        { id: 'detailed', name: '상세형' }
      ]
    },
    {
      id: 'reservation',
      name: '예약',
      description: '테이블 예약 섹션',
      required: false,
      options: [
        { id: 'contact', name: '연락처 안내' },
        { id: 'form', name: '예약 폼' }
      ]
    }
  ]
} as const;

interface CreateProjectFormProps {
  userId: string;
}

type FormStep = 'service-type' | 'style' | 'color' | 'sections' | 'content';

export default function CreateProjectForm({ userId }: CreateProjectFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FormStep>('service-type');
  const [formData, setFormData] = useState({
    serviceType: '',
    layout: '',
    mood: [] as string[],
    mainColor: '#000000',
    subColor: '#ffffff',
    sections: [] as string[],
    content: {} as Record<string, any>
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<{ structure: string; code: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleServiceTypeSelect = (typeId: string) => {
    setFormData(prev => ({ ...prev, serviceType: typeId }));
    setCurrentStep('style');
  };

  const handleLayoutSelect = (layoutId: string) => {
    setFormData(prev => ({ ...prev, layout: layoutId }));
  };

  const handleMoodToggle = (moodId: string) => {
    setFormData(prev => ({
      ...prev,
      mood: prev.mood.includes(moodId)
        ? prev.mood.filter(id => id !== moodId)
        : [...prev.mood, moodId]
    }));
  };

  const handleColorChange = (type: 'main' | 'sub', color: string) => {
    setFormData(prev => ({
      ...prev,
      [type === 'main' ? 'mainColor' : 'subColor']: color
    }));
  };

  const handleStyleStepNext = () => {
    if (!formData.layout) {
      setError('레이아웃을 선택해주세요.');
      return;
    }
    if (formData.mood.length === 0) {
      setError('분위기를 하나 이상 선택해주세요.');
      return;
    }
    setError(null);
    setCurrentStep('color');
  };

  const handleColorStepNext = () => {
    setError(null);
    setCurrentStep('sections');
  };

  const availableSections = useMemo(() => {
    return SECTIONS_BY_TYPE[formData.serviceType as keyof typeof SECTIONS_BY_TYPE] || [];
  }, [formData.serviceType]);

  const handleSectionOptionSelect = (sectionId: string, optionId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: [
        ...prev.sections.filter(s => !s.startsWith(sectionId + ':')),
        `${sectionId}:${optionId}`
      ]
    }));
  };

  const handleSectionsStepNext = () => {
    // 필수 섹션이 모두 선택되었는지 확인
    const requiredSections = availableSections.filter(section => section.required);
    const selectedSectionIds = formData.sections.map(s => s.split(':')[0]);
    
    const missingSections = requiredSections.filter(
      section => !selectedSectionIds.includes(section.id)
    );

    if (missingSections.length > 0) {
      setError(`다음 필수 섹션을 선택해주세요: ${missingSections.map(s => s.name).join(', ')}`);
      return;
    }

    setError(null);
    generateInitialContent();
  };

  const generateInitialContent = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 선택된 섹션 정보 수집
      const selectedSections = formData.sections.map(s => {
        const [sectionId, optionId] = s.split(':');
        const section = availableSections.find(sec => sec.id === sectionId);
        return {
          id: sectionId,
          name: section?.name || '',
          option: section?.options.find(opt => opt.id === optionId)?.name || '',
          description: section?.description || ''
        };
      });

      // 서비스 타입 정보
      const serviceType = SERVICE_TYPES.find(type => type.id === formData.serviceType);
      
      console.log('=== 콘텐츠 생성 시작 ===');
      console.log('선택된 섹션:', selectedSections);
      console.log('서비스 타입:', serviceType);
      
      // 1단계: 웹사이트 구조 생성
      const prompt = `
비즈니스 유형: ${serviceType?.name}
스타일: ${formData.mood.map(m => MOOD_OPTIONS.find(opt => opt.id === m)?.name).join(', ')}
색상: 메인 - ${formData.mainColor}, 보조 - ${formData.subColor}
선택된 섹션: ${selectedSections.map(s => `${s.name} (${s.option})`).join(', ')}

위 정보를 바탕으로 웹사이트의 구조와 각 섹션별 주요 콘텐츠를 제안해주세요.
`;

      console.log('Prompt:', prompt);

      const structureContent = await generateContent(prompt);
      console.log('생성된 구조:', structureContent);

      // 2단계: 실제 코드 생성
      const codeContent = await generateCode(structureContent);
      console.log('생성된 코드:', codeContent);

      // 컴포넌트 파싱
      const components = parseGeneratedCode(codeContent);
      console.log('파싱된 컴포넌트:', components);

      // 생성된 콘텐츠 저장
      setGeneratedContent({
        structure: structureContent,
        code: codeContent
      });

      // 다음 단계로 이동
      setCurrentStep('content');
    } catch (error) {
      console.error('Content generation error:', error);
      setError('콘텐츠 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!generatedContent) {
        throw new Error('생성된 콘텐츠가 없습니다.');
      }

      // 컴포넌트 코드 파싱
      const components = parseGeneratedCode(generatedContent.code);
      console.log('Parsed components:', components);

      // 프로젝트 설정 데이터 구성
      const settings = {
        serviceType: formData.serviceType,
        layout: formData.layout,
        mood: formData.mood,
        colors: {
          main: formData.mainColor,
          sub: formData.subColor
        },
        sections: formData.sections
      };

      // 프로젝트 생성
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          name: '새 프로젝트',
          description: '',
          settings,
          components,
          content: {
            structure: generatedContent.structure
          }
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // 프로젝트 에디터 페이지로 이동
      router.push(`/dashboard/editor/${project.id}`);
    } catch (err) {
      setError('프로젝트 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('Project creation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderServiceTypeStep = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-gray-900">서비스 유형 선택</h2>
      <p className="text-sm text-gray-500">만들고자 하는 페이지의 유형을 선택해주세요.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICE_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => handleServiceTypeSelect(type.id)}
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <div className="space-y-3">
              <h3 className="text-base font-medium text-gray-900">{type.name}</h3>
              <p className="text-sm text-gray-500">{type.description}</p>
              <ul className="text-xs text-gray-500 space-y-1">
                {type.features.map((feature, index) => (
                  <li key={index}>• {feature}</li>
                ))}
              </ul>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStyleStep = () => (
    <div className="space-y-8">
      {/* 레이아웃 선택 */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">레이아웃 선택</h2>
        <p className="text-sm text-gray-500">페이지의 전체적인 구조를 선택해주세요.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {LAYOUT_OPTIONS.map((layout) => (
            <button
              key={layout.id}
              onClick={() => handleLayoutSelect(layout.id)}
              className={`
                relative rounded-lg border p-4 hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500
                ${formData.layout === layout.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-300 bg-white'}
              `}
            >
              <div className="space-y-2">
                <h3 className="text-base font-medium text-gray-900">{layout.name}</h3>
                <p className="text-sm text-gray-500">{layout.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 분위기 선택 */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">분위기 선택</h2>
        <p className="text-sm text-gray-500">페이지의 전체적인 분위기를 선택해주세요. (다중 선택 가능)</p>
        <div className="flex flex-wrap gap-3">
          {MOOD_OPTIONS.map((mood) => (
            <button
              key={mood.id}
              onClick={() => handleMoodToggle(mood.id)}
              className={`
                rounded-full px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                ${formData.mood.includes(mood.id)
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}
              `}
            >
              {mood.name}
            </button>
          ))}
        </div>
      </div>

      {/* 다음 단계 버튼 */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCurrentStep('service-type')}
          className="mr-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          이전
        </button>
        <button
          type="button"
          onClick={handleStyleStepNext}
          className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          다음
        </button>
      </div>
    </div>
  );

  const renderColorStep = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">색상 선택</h2>
        <p className="text-sm text-gray-500">
          페이지의 주요 색상과 보조 색상을 선택해주세요. 아래 예시에서 색상이 어떻게 적용되는지 확인할 수 있습니다.
        </p>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 컬러 피커 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                메인 색상
              </label>
              <div className="mt-1 flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.mainColor}
                  onChange={(e) => handleColorChange('main', e.target.value)}
                  className="h-8 w-8 rounded-md border-gray-300 shadow-sm"
                />
                <span className="text-sm text-gray-500">{formData.mainColor}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                보조 색상
              </label>
              <div className="mt-1 flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.subColor}
                  onChange={(e) => handleColorChange('sub', e.target.value)}
                  className="h-8 w-8 rounded-md border-gray-300 shadow-sm"
                />
                <span className="text-sm text-gray-500">{formData.subColor}</span>
              </div>
            </div>
          </div>

          {/* 컬러 프리뷰 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">미리보기</h3>
            <ColorPreview
              mainColor={formData.mainColor}
              subColor={formData.subColor}
            />
          </div>
        </div>
      </div>

      {/* 이전/다음 버튼 */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCurrentStep('style')}
          className="mr-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          이전
        </button>
        <button
          type="button"
          onClick={handleColorStepNext}
          className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          다음
        </button>
      </div>
    </div>
  );

  const renderSectionsStep = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">섹션 선택</h2>
        <p className="text-sm text-gray-500">
          페이지를 구성할 섹션들을 선택해주세요. 필수 섹션은 반드시 선택해야 합니다.
        </p>

        <div className="space-y-6">
          {availableSections.map((section) => (
            <div
              key={section.id}
              className={`rounded-lg border ${section.required ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200'} p-4`}
            >
              <div className="mb-4">
                <div className="flex items-center">
                  <h3 className="text-base font-medium text-gray-900">
                    {section.name}
                    {section.required && (
                      <span className="ml-2 text-sm text-indigo-600">(필수)</span>
                    )}
                  </h3>
                </div>
                <p className="mt-1 text-sm text-gray-500">{section.description}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                {section.options.map((option) => {
                  const isSelected = formData.sections.includes(`${section.id}:${option.id}`);
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSectionOptionSelect(section.id, option.id)}
                      className={`
                        rounded-md px-4 py-2 text-sm font-medium
                        ${isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}
                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                      `}
                    >
                      {option.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 이전/다음 버튼 */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCurrentStep('color')}
          className="mr-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          이전
        </button>
        <button
          type="button"
          onClick={handleSectionsStepNext}
          className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          다음
        </button>
      </div>
    </div>
  );

  const renderContentStep = () => {
    if (!generatedContent) return null;

    const components = parseGeneratedCode(generatedContent.code);

    return (
      <div className="space-y-8">
        <h2 className="text-lg font-medium text-gray-900">생성된 웹사이트 미리보기</h2>
        <p className="text-sm text-gray-500">
          생성된 웹사이트를 확인해보세요. 마음에 드시면 저장 버튼을 눌러주세요.
        </p>
        
        {/* 프리뷰 영역 */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
            </div>
            <div className="flex-1 text-center">
              <span className="text-sm text-gray-500">미리보기</span>
            </div>
          </div>
          <div className="h-[600px] w-full overflow-auto bg-white">
            <HotReload
              components={components}
              settings={{
                serviceType: formData.serviceType,
                layout: formData.layout,
                mood: formData.mood,
                colors: {
                  main: formData.mainColor,
                  sub: formData.subColor
                },
                sections: formData.sections
              }}
            />
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => setCurrentStep('sections')}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            이전
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? '저장 중...' : '저장하기'}
          </button>
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
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'service-type':
        return renderServiceTypeStep();
      case 'style':
        return renderStyleStep();
      case 'color':
        return renderColorStep();
      case 'sections':
        return renderSectionsStep();
      case 'content':
        return renderContentStep();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">오류</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* 진행 상태 표시 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {['서비스 유형', '스타일', '컬러', '섹션'].map((step, index) => (
            <div
              key={step}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${index === ['service-type', 'style', 'color', 'sections'].indexOf(currentStep)
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {step}
            </div>
          ))}
        </nav>
      </div>

      {/* 현재 단계 렌더링 */}
      {renderCurrentStep()}
    </div>
  );
} 