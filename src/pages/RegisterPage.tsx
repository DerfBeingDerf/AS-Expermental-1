import React from 'react';
import AuthForm from '../components/auth/AuthForm';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { signUp } = useAuth();

  return (
    <div className="container max-w-md mx-auto py-16 px-4">
      <AuthForm mode="register" onSubmit={signUp} />
    </div>
  );
}