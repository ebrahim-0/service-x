"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { sendPasswordResetEmail } from "firebase/auth";
import { withCallbacks } from "@/lib/withCallbacks";
import { useActionState, useTransition } from "react";
import { auth } from "@/lib/firebase/firebase.browser";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const resetPassword = async (data: ForgotPasswordFormValues) => {
  try {
    await sendPasswordResetEmail(auth, data.email);
    return { succeeded: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send reset link";
    return {
      succeeded: false,
      error: errorMessage,
    };
  }
};

export function ForgotPasswordForm() {
  const t = useTranslations("trans");
  const { push } = useRouter();

  const { control, handleSubmit } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetPasswordForm = withCallbacks(resetPassword, {
    onSuccess() {
      toast.success(t("messages.success.passwordReset"));
      push("/login");
    },
    onError(result) {
      toast.error(result.error);
    },
  });

  const [state, resetAction] = useActionState(
    (_: unknown, payload: ForgotPasswordFormValues) =>
      resetPasswordForm(payload),
    undefined
  );

  const [isPending, startTransition] = useTransition();

  const onSubmit = async (formData: ForgotPasswordFormValues) => {
    startTransition(() => {
      resetAction(formData);
    });
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">{t("auth.forgotPassword.title")}</h1>
        <p className="text-gray-500">{t("auth.forgotPassword.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={control}
          name="email"
          label={t("auth.forgotPassword.email")}
          type="email"
          placeholder={t("common.email.placeholder")}
          disabled={isPending}
        />

        <Button
          variant="primary"
          type="submit"
          className="w-full"
          disabled={isPending}
        >
          {isPending
            ? t("auth.forgotPassword.submitting")
            : t("auth.forgotPassword.submit")}
        </Button>

        <p className="text-center text-sm text-gray-500">
          <Link href="/login" className="text-blue-500 hover:underline">
            {t("auth.forgotPassword.backToLogin")}
          </Link>
        </p>
      </form>

      {state?.error && (
        <p className="text-sm text-red-500 text-center mt-2">{state.error}</p>
      )}
    </div>
  );
}
