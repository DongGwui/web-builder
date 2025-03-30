const CLAUDE_API_KEY = process.env.NEXT_PUBLIC_CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export async function generateContent(prompt: string) {
  try {
    console.log('Generating content with prompt:', prompt);
    
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Content generated successfully');
    return data.content;
  } catch (error) {
    console.error('Content generation error:', error);
    throw error;
  }
}

export async function generateCode(structure: string) {
  const prompt = `
다음 웹사이트 구조를 기반으로 React 컴포넌트의 return 문만 생성해주세요:

${structure}

요구사항:
1. 각 컴포넌트는 return 문만 포함해야 합니다.
2. 타입 정의, import 문, 함수 선언 등은 포함하지 마세요.
3. 스타일링은 Tailwind CSS 클래스를 사용합니다.
4. 각 섹션의 제목에는 'section-title' 클래스를 사용하세요.
5. 카드형 요소에는 'card' 클래스를 사용하세요.
6. 버튼에는 'button' 클래스를 사용하세요.
7. 반응형 디자인을 고려해주세요.

스타일 가이드:
- 섹션 제목: <h2 class="section-title">제목</h2>
- 카드: <div class="card">내용</div>
- 버튼: <button class="button">텍스트</button>
- 컨테이너: <div class="container mx-auto px-4 sm:px-6 lg:px-8">
- 그리드: <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

예시:

// Hero.tsx
return (
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <h1 class="section-title">홍길동</h1>
    <p class="text-xl mb-8">웹 개발자</p>
    <button class="button">자세히 보기</button>
  </div>
);

// About.tsx
return (
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <h2 class="section-title">자기소개</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="card p-6">
        <h3 class="text-xl font-semibold mb-4">경력</h3>
        <p class="text-gray-600">5년 이상의 웹 개발 경력</p>
      </div>
    </div>
  </div>
);

각 컴포넌트는 위와 같이 파일명 주석과 return 문만 포함해야 합니다.
모든 스타일은 Tailwind CSS 클래스로만 작성하며, 인라인 스타일이나 CSS-in-JS는 사용하지 않습니다.
`;

  return generateContent(prompt);
} 