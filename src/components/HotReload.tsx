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

      // 분위기에 따른 스타일 클래스와 CSS 변수
      const moodStyles = {
        professional: {
          fontFamily: "'Playfair Display', serif",
          bodyClass: 'font-serif leading-relaxed',
          customCSS: `
            .section-title { @apply font-serif text-4xl font-bold mb-8 relative; }
            .section-title::after { content: ''; @apply block absolute w-24 h-1 bg-gray-800 mt-4; }
            .card { @apply transition-transform duration-300 hover:scale-105; }
          `
        },
        modern: {
          fontFamily: "'Inter', sans-serif",
          bodyClass: 'font-sans leading-relaxed tracking-tight',
          customCSS: `
            .section-title { @apply font-sans text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600; }
            .card { @apply backdrop-blur-lg bg-white/80 shadow-lg; }
            .button { @apply rounded-full transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1; }
          `
        },
        minimal: {
          fontFamily: "'DM Sans', sans-serif",
          bodyClass: 'font-sans leading-relaxed',
          customCSS: `
            .section-title { @apply font-sans text-3xl font-light uppercase tracking-widest; }
            .card { @apply border border-gray-100; }
            .button { @apply border border-current rounded-none transition-colors duration-300; }
          `
        },
        playful: {
          fontFamily: "'Quicksand', sans-serif",
          bodyClass: 'font-rounded leading-relaxed',
          customCSS: `
            .section-title { @apply font-rounded text-4xl font-bold text-center relative z-10; }
            .section-title::before { content: ''; @apply absolute -inset-4 -z-10 bg-yellow-200 opacity-50 transform -rotate-2; }
            .card { @apply rounded-2xl border-4 border-current transform transition-transform duration-300 hover:rotate-1; }
            .button { @apply rounded-full transform transition-transform duration-300 hover:scale-110 hover:rotate-3; }
          `
        },
        luxury: {
          fontFamily: "'Cormorant Garamond', serif",
          bodyClass: 'font-serif leading-relaxed tracking-wide',
          customCSS: `
            .section-title { @apply font-serif text-5xl font-light tracking-wider text-center; }
            .section-title::before, .section-title::after { content: '★'; @apply mx-4 text-2xl text-yellow-600; }
            .card { @apply border border-yellow-600 shadow-xl; }
            .button { @apply border-2 border-yellow-600 hover:bg-yellow-600 transition-colors duration-300; }
          `
        },
        casual: {
          fontFamily: "'Poppins', sans-serif",
          bodyClass: 'font-sans leading-relaxed',
          customCSS: `
            .section-title { @apply font-sans text-4xl font-semibold; }
            .card { @apply rounded-lg shadow-md transition-all duration-300 hover:shadow-xl; }
            .button { @apply rounded-lg transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg; }
          `
        }
      };

      const selectedMood = settings.mood[0] as keyof typeof moodStyles;
      const moodStyle = moodStyles[selectedMood] || moodStyles.modern;

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
              sectionStyle = `
                min-h-[80vh] flex items-center justify-center
                ${selectedMood === 'modern' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' : ''}
                ${selectedMood === 'playful' ? 'bg-gradient-to-r from-yellow-200 via-pink-200 to-yellow-200' : ''}
                ${selectedMood === 'luxury' ? 'bg-gradient-to-b from-black to-gray-900 text-white' : ''}
              `;
              break;
            case 'about':
              sectionStyle = `
                py-24
                ${selectedMood === 'modern' ? 'bg-gray-50' : ''}
                ${selectedMood === 'playful' ? 'bg-white' : ''}
                ${selectedMood === 'luxury' ? 'bg-gray-900 text-white' : ''}
              `;
              break;
            case 'projects':
              sectionStyle = `
                py-24
                ${selectedMood === 'modern' ? 'bg-white' : ''}
                ${selectedMood === 'playful' ? 'bg-yellow-50' : ''}
                ${selectedMood === 'luxury' ? 'bg-black text-white' : ''}
              `;
              break;
            case 'contact':
              sectionStyle = `
                py-24
                ${selectedMood === 'modern' ? 'bg-gray-900 text-white' : ''}
                ${selectedMood === 'playful' ? 'bg-pink-50' : ''}
                ${selectedMood === 'luxury' ? 'bg-gray-900 text-white' : ''}
              `;
              break;
            case 'footer':
              sectionStyle = `
                py-8
                ${selectedMood === 'modern' ? 'bg-black text-white' : ''}
                ${selectedMood === 'playful' ? 'bg-yellow-100' : ''}
                ${selectedMood === 'luxury' ? 'bg-black text-white border-t border-yellow-600' : ''}
              `;
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
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
            <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;700&display=swap" rel="stylesheet">
            <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&display=swap" rel="stylesheet">
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
            <style>
              :root {
                --main-color: ${settings.colors.main};
                --sub-color: ${settings.colors.sub};
                font-family: ${moodStyle.fontFamily};
              }
              body {
                font-family: ${moodStyle.fontFamily};
              }
              .main-color { color: var(--main-color); }
              .main-bg { background-color: var(--main-color); }
              .sub-color { color: var(--sub-color); }
              .sub-bg { background-color: var(--sub-color); }
              ${moodStyle.customCSS}
            </style>
          </head>
          <body class="min-h-screen bg-white ${moodStyle.bodyClass}">
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