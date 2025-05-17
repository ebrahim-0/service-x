import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

const page = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="flex flex-col gap-7">
        <img src="/assets/car-link-logo.svg" alt="Logo" className="w-full h-20 mb-2" />
        <ForgotPasswordForm />
      </div>
    </div>
  );
};

export default page;
