'use client';

import { AuthForm } from '@/components/auth-form';

export default function SignUpPage() {
  return (
    <AuthForm
      type="signup"
      title="Create an account"
      description="Enter your email below to create your account"
    />
  );
} 