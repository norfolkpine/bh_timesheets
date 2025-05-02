'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { authService } from '@/services/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthFormProps {
  type: 'login' | 'signup' | 'reset' | 'reset-confirm';
  title: string;
  description: string;
}

export function AuthForm({ type, title, description }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      switch (type) {
        case 'login':
          const response = await authService.login({ email, password, remember });
          if (response) {
            router.push('/dashboard');
          }
          break;
        case 'signup':
          await authService.register({ email, password1: password, password2: confirmPassword });
          setSuccess('Registration successful! Please check your email to verify your account.');
          break;
        case 'reset':
          await authService.requestPasswordReset({ email });
          setSuccess('Password reset instructions have been sent to your email.');
          break;
        case 'reset-confirm':
          const params = new URLSearchParams(window.location.search);
          const token = params.get('token');
          const uid = params.get('uid');
          if (!token || !uid) {
            throw new Error('Invalid reset link');
          }
          await authService.confirmPasswordReset({
            token,
            uid,
            new_password1: password,
            new_password2: confirmPassword,
          });
          setSuccess('Password has been reset successfully. You can now login with your new password.');
          break;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          BH Timesheets
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;This timesheet system has streamlined our workflow and made time tracking a breeze.&rdquo;
            </p>
            <footer className="text-sm">Sofia Davis</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert className="mb-4">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {(type === 'signup' || type === 'reset-confirm') && (
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  )}
                  {type === 'login' && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={remember}
                        onCheckedChange={(checked) => setRemember(checked as boolean)}
                      />
                      <Label htmlFor="remember" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Remember me
                      </Label>
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Loading...' : type === 'login' ? 'Sign in' : type === 'signup' ? 'Sign up' : 'Reset Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              {type === 'login' && (
                <div className="text-sm text-center">
                  <a href="/reset-password" className="text-primary hover:underline">
                    Forgot your password?
                  </a>
                  <span className="mx-2">•</span>
                  <a href="/signup" className="text-primary hover:underline">
                    Create an account
                  </a>
                </div>
              )}
              {type === 'signup' && (
                <div className="text-sm text-center">
                  <a href="/login" className="text-primary hover:underline">
                    Already have an account?
                  </a>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 