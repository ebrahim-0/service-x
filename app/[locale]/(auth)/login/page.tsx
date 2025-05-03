import { LoginForm } from "@/components/auth/LoginForm";
import React from "react";

export default function page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <LoginForm />
    </div>
  );
}
