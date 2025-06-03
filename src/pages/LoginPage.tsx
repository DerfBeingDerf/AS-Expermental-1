import React from 'react';
import AuthForm from '../components/auth/AuthForm';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();

  return (
    <div className="container max-w-md mx-auto py-16 px-4">
      <AuthForm mode="login" onSubmit={signIn} />
    </div>
  );
}