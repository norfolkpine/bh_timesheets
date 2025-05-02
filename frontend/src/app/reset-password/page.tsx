'use client';

import { AuthForm } from "@/components/auth-form";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <AuthForm
        type="reset"
        title="Reset your password"
        description="Enter your email address and we'll send you instructions to reset your password"
      />
    </div>
  );
} 