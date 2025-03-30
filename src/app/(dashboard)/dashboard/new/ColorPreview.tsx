interface ColorPreviewProps {
  mainColor: string;
  subColor: string;
}

export default function ColorPreview({ mainColor, subColor }: ColorPreviewProps) {
  return (
    <div className="space-y-6 rounded-lg border border-gray-200 p-6">
      {/* 헤더 예시 */}
      <div style={{ backgroundColor: mainColor }} className="rounded-t-lg p-4">
        <div className="flex items-center justify-between">
          <div style={{ color: subColor }} className="text-lg font-bold">
            로고
          </div>
          <nav className="flex space-x-4">
            <div style={{ color: subColor }} className="cursor-pointer">메뉴 1</div>
            <div style={{ color: subColor }} className="cursor-pointer">메뉴 2</div>
            <div style={{ color: subColor }} className="cursor-pointer">메뉴 3</div>
          </nav>
        </div>
      </div>

      {/* 버튼 예시 */}
      <div className="space-y-4">
        <div className="space-x-4">
          <button
            style={{ backgroundColor: mainColor, color: subColor }}
            className="rounded-md px-4 py-2 font-medium shadow-sm"
          >
            메인 버튼
          </button>
          <button
            style={{ backgroundColor: subColor, color: mainColor, border: `1px solid ${mainColor}` }}
            className="rounded-md px-4 py-2 font-medium shadow-sm"
          >
            서브 버튼
          </button>
        </div>
      </div>

      {/* 카드 예시 */}
      <div className="grid grid-cols-2 gap-4">
        <div
          style={{ borderColor: mainColor }}
          className="rounded-lg border p-4 shadow-sm"
        >
          <h3 style={{ color: mainColor }} className="text-lg font-medium">
            카드 제목
          </h3>
          <p style={{ color: subColor }} className="mt-2">
            카드 내용이 들어갑니다.
          </p>
        </div>
        <div
          style={{ backgroundColor: subColor, borderColor: mainColor }}
          className="rounded-lg border p-4 shadow-sm"
        >
          <h3 style={{ color: mainColor }} className="text-lg font-medium">
            카드 제목
          </h3>
          <p style={{ color: mainColor }} className="mt-2">
            카드 내용이 들어갑니다.
          </p>
        </div>
      </div>
    </div>
  );
} 