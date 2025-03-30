export interface ProjectSettings {
  serviceType: string;
  layout: string;
  mood: string[];
  colors: {
    main: string;
    sub: string;
  };
  sections: string[];
}

export interface ComponentFile {
  name: string;
  content: string;
}

export function parseGeneratedCode(code: string): ComponentFile[] {
  const components: ComponentFile[] = [];
  const componentRegex = /\/\/ ([A-Za-z]+\.tsx)\n([\s\S]*?)(?=\/\/ [A-Za-z]+\.tsx|$)/g;
  
  let match;
  while ((match = componentRegex.exec(code)) !== null) {
    const [_, fileName, content] = match;
    components.push({
      name: fileName,
      content: content.trim()
    });
  }

  return components;
}

// 프리뷰를 위한 임시 저장소 타입
export interface PreviewStorage {
  projectId: string;
  components: ComponentFile[];
  expiresAt: Date;
} 