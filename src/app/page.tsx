'use client';

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="max-w-2xl text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            AI로 만드는 나만의 웹사이트
          </h1>
          <p className="mb-8 text-lg leading-8 text-gray-600">
            웹 개발 지식이 없어도 괜찮아요. AI의 도움을 받아 원하는 웹사이트를 쉽게 만들어보세요.
            드래그 앤 드롭으로 간단하게 수정하고, 클릭 한 번으로 배포까지 가능합니다.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/login"
              className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              시작하기
            </Link>
            <Link
              href="/about"
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              더 알아보기
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
