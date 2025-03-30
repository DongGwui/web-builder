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
4. 반응형 디자인을 고려해주세요.
5. 설명이나 주석은 포함하지 마세요.

다음과 같은 형식으로만 작성해주세요:

// Hero.tsx
return (
  <div className="flex min-h-screen items-center justify-center">
    <h1 className="text-4xl font-bold">제목</h1>
  </div>
);

// About.tsx
return (
  <div className="container mx-auto py-16">
    <h2 className="text-3xl font-bold">소개</h2>
  </div>
);

각 컴포넌트는 위와 같이 파일명 주석과 return 문만 포함해야 합니다.
`;

  return generateContent(prompt);
} 