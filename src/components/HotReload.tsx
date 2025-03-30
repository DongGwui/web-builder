import { useEffect, useState } from 'react';
import type { ComponentFile } from '@/lib/projectGenerator';

interface HotReloadProps {
  components: ComponentFile[];
  settings: {
    serviceType: string;
    layout: string;
    mood: string[];
    colors: {
      main: string;
      sub: string;
    };
    sections: string[];
  };
}

export default function HotReload({ components, settings }: HotReloadProps) {
  const [error, setError] = useState<string | null>(null);
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    try {
      // 디버깅을 위한 로그
      console.log('=== 컴포넌트 변환 시작 ===');
      console.log('받은 컴포넌트:', components);
      console.log('설정:', settings);

      // 레이아웃 스타일 결정
      const layoutStyle = settings.layout === 'grid' 
        ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 gap-8'
        : settings.layout === 'scroll'
        ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16'
        : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 divide-y divide-gray-200';

      // 분위기에 따른 스타일 클래스
      const moodClasses = {
        professional: 'font-serif',
        modern: 'font-sans',
        minimal: 'max-w-5xl mx-auto',
        playful: 'font-rounded',
        luxury: 'font-serif tracking-wide',
        casual: 'font-sans'
      };

      const moodClass = settings.mood[0] ? moodClasses[settings.mood[0] as keyof typeof moodClasses] : '';

      // 컴포넌트들을 HTML로 변환
      const componentsHtml = components
        .sort((a, b) => {
          const aSection = a.name.split('.')[0];
          const bSection = b.name.split('.')[0];
          const aIndex = settings.sections.findIndex(s => s.startsWith(aSection + ':'));
          const bIndex = settings.sections.findIndex(s => s.startsWith(bSection + ':'));
          return aIndex - bIndex;
        })
        .map(component => {
          console.log(`\n=== 컴포넌트 [${component.name}] 변환 시작 ===`);
          console.log('원본 코드:', component.content);

          // JSX를 HTML로 변환
          let html = component.content;
          
          // return 문 추출
          const returnMatch = html.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*;?/);
          if (!returnMatch) {
            console.log('return 문을 찾을 수 없습니다.');
            return '';
          }
          html = returnMatch[1];
          console.log('\n추출된 return 문 내용:', html);

          // React 속성 변환
          html = html
            .replace(/className=/g, 'class=')
            .replace(/onClick=/g, 'onclick=')
            .replace(/onChange=/g, 'onchange=');

          // JSX 표현식 처리
          html = html
            .replace(/{`([^`]+)`}/g, '$1')
            .replace(/{\s*"([^"]+)"\s*}/g, '$1')
            .replace(/{\s*'([^']+)'\s*}/g, '$1')
            .replace(/{\s*true\s*}/g, '')
            .replace(/{\s*false\s*}/g, '');

          // 조건부 렌더링 제거
          html = html.replace(/{[^}]+\?[^:}]+:[^}]+}/g, '');

          // 남은 JSX 표현식 제거
          html = html.replace(/{[^}]+}/g, '');

          // 타입 정의와 관련된 텍스트 제거
          html = html.replace(/type\s+\w+\s*=\s*[^;]+;/g, '');
          html = html.replace(/const\s+\w+\s*:\s*FC\s*[^=]+=\s*\(\s*\)\s*=>\s*/g, '');
          html = html.replace(/const\s+\w+\s*:\s*\w+\[\]\s*=\s*\[[^\]]*\];/g, '');

          // 주석 제거
          html = html.replace(/\/\/.*/g, '');
          html = html.replace(/\/\*[\s\S]*?\*\//g, '');

          // 공백 정리
          html = html.replace(/\s+/g, ' ').trim();

          // 섹션 ID 추출
          const sectionId = component.name.split('.')[0];
          const sectionOption = settings.sections
            .find(s => s.startsWith(sectionId + ':'))
            ?.split(':')[1];

          // 섹션별 스타일 결정
          let sectionStyle = '';
          switch (sectionId.toLowerCase()) {
            case 'hero':
              sectionStyle = 'min-h-[80vh] flex items-center justify-center';
              break;
            case 'about':
              sectionStyle = 'py-24';
              break;
            case 'projects':
              sectionStyle = 'py-24 bg-gray-50';
              break;
            case 'contact':
              sectionStyle = 'py-24';
              break;
            case 'footer':
              sectionStyle = 'py-8 bg-gray-50';
              break;
            default:
              sectionStyle = 'py-24';
          }

          return `
            <section id="${sectionId}" class="${sectionStyle}">
              ${html}
            </section>
          `;
        })
        .join('\n');

      // 최종 HTML 문서 생성
      const finalHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>
              :root {
                --main-color: ${settings.colors.main};
                --sub-color: ${settings.colors.sub};
              }
              body {
                font-family: 'Inter', sans-serif;
              }
              .main-color { color: var(--main-color); }
              .main-bg { background-color: var(--main-color); }
              .sub-color { color: var(--sub-color); }
              .sub-bg { background-color: var(--sub-color); }
            </style>
          </head>
          <body class="min-h-screen bg-white ${moodClass}">
            <main>
              ${componentsHtml}
            </main>
            <script>
              // 동적 기능을 위한 기본 JavaScript
              document.querySelectorAll('button').forEach(button => {
                button.onclick = () => alert('미리보기에서는 동작하지 않습니다.');
              });
              document.querySelectorAll('a').forEach(link => {
                link.onclick = (e) => {
                  e.preventDefault();
                  alert('미리보기에서는 동작하지 않습니다.');
                };
              });
            </script>
          </body>
        </html>
      `;

      console.log('\n=== 최종 HTML ===');
      console.log(finalHtml);

      setHtml(finalHtml);
      setError(null);
    } catch (err) {
      console.error('Preview generation error:', err);
      setError('프리뷰 생성 중 오류가 발생했습니다.');
    }
  }, [components, settings]);

  if (error) {
    return (
      <div className="grid h-full place-items-center">
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html}
      className="h-full w-full border-0"
      sandbox="allow-scripts"
      title="미리보기"
    />
  );
} 