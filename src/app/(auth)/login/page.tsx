'use client';

import { AuthButton } from '@/app/components/auth/AuthButton';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            계정에 로그인하기
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            또는{" "}
            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
              새로운 계정 만들기
            </a>
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <AuthButton />
        </div>
      </div>
    </div>
  );
} 