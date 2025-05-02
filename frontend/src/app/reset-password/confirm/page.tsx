'use client';

import { AuthForm } from '@/components/auth-form';

export default function ResetPasswordConfirmPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <AuthForm
        type="reset-confirm"
        title="Set new password"
        description="Enter your new password below"
      />
    </div>
  );
} 