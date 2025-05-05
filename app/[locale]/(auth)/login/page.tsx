import { LoginForm } from "@/components/auth/LoginForm";
import React from "react";

export default function page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="flex flex-col gap-7">
        <img src="/assets/logo.svg" alt="Logo" className="w-full h-20 mb-2" />
        <LoginForm />
      </div>
    </div>
  );
}
