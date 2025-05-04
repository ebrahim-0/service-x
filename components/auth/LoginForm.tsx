"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { loginAdmin } from "@/lib/auth";
import { withCallbacks } from "@/lib/withCallbacks";
import { useActionState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Form } from "../ui/form";

const loginSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t("errors.invalid_email")),
    password: z.string().min(1, t("errors.password_required")),
  });

export type LoginFormValues = z.infer<ReturnType<typeof loginSchema>>;

export function LoginForm() {
  const t = useTranslations("trans");
  const { replace } = useRouter();

  const schema = loginSchema(t);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginForm = withCallbacks(
    (data: LoginFormValues) => loginAdmin(data.email, data.password),
    {
      onSuccess() {
        toast.success(t("messages.success.login"));
        replace("/");
      },
      onError(result) {
        toast.error(result.error);
      },
    }
  );

  const [state, loginAction] = useActionState(
    (_: unknown, payload: LoginFormValues) => loginForm(payload),
    undefined
  );

  const [isPending, startTransition] = useTransition();

  const onSubmit = async (formData: LoginFormValues) => {
    startTransition(() => {
      loginAction(formData);
    });
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">{t("auth.login.title")}</h1>
        <p className="text-gray-500">{t("auth.login.subtitle")}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            label={t("auth.login.email")}
            type="email"
            placeholder={t("common.email.placeholder")}
            disabled={isPending}
          />

          <FormField
            control={form.control}
            name="password"
            label={t("auth.login.password")}
            type="password"
            placeholder={t("common.password.placeholder")}
            disabled={isPending}
          />

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-blue-500 hover:underline"
            >
              {t("auth.login.forgotPassword")}
            </Link>
          </div>

          <Button
            variant="primary"
            type="submit"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? t("auth.login.submitting") : t("auth.login.submit")}
          </Button>

          {/* <p className="text-sm text-center text-gray-500">
          {t("auth.login.noAccount")}{" "}
          <Link to="/auth/register" className="text-blue-500 hover:underline">
            {t("auth.login.createAccount")}
          </Link>
        </p> */}
        </form>
      </Form>

      {state?.error && (
        <p className="mt-2 text-sm text-center text-red-500">{state.error}</p>
      )}
    </div>
  );
}
