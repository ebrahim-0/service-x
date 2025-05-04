"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { withCallbacks } from "@/lib/withCallbacks";
import { useActionState, useTransition } from "react";
import { useSelector } from "zustore";
import { useTranslations } from "next-intl";
import { createAdminUser } from "@/lib/auth-admin";

const createAdminSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t("errors.invalid_email")),
    username: z.string().min(3, t("errors.username_min_length")),
    password: z
      .string()
      .min(1, t("errors.password_required"))
      .min(6, t("errors.password_min_length")),
  });

type CreateAdminFormValues = z.infer<ReturnType<typeof createAdminSchema>>;

export function CreateAdminForm() {
  const t = useTranslations("trans");
  const user = useSelector("user"); // Assumes user has { uid, email }

  // Create the schema with localized messages
  const schema = createAdminSchema(t);

  const { control, handleSubmit, reset } = useForm<CreateAdminFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
    },
  });

  const createAdminForm = withCallbacks(
    (data: CreateAdminFormValues) =>
      createAdminUser(
        { uid: user?.uid || "", email: user?.email || null }, // Pass serializable user data
        data
      ),
    {
      onSuccess() {
        toast.success(t("messages.success.register"));
        reset();
      },
      onError(result) {
        toast.error(result.error);
      },
    }
  );

  const [state, createAction] = useActionState(
    (_: unknown, payload: CreateAdminFormValues) => createAdminForm(payload),
    undefined
  );

  const [isPending, startTransition] = useTransition();

  const onSubmit = async (formData: CreateAdminFormValues) => {
    if (!user?.uid) {
      toast.error(t("errors.unauthenticated"));
      return;
    }
    startTransition(() => {
      createAction(formData);
    });
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">{t("auth.register.title")}</h1>
        <p className="text-gray-500">{t("auth.register.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={control}
          name="email"
          label={t("auth.register.email")}
          type="email"
          placeholder={t("common.email.placeholder")}
          disabled={isPending}
        />

        <FormField
          control={control}
          name="username"
          label={t("auth.register.username")}
          placeholder={t("auth.register.username")}
          disabled={isPending}
        />

        <FormField
          control={control}
          name="password"
          label={t("auth.register.password")}
          type="password"
          placeholder={t("common.password.placeholder")}
          disabled={isPending}
        />

        <Button
          variant="primary"
          type="submit"
          className="w-full"
          disabled={isPending || !user?.uid}
        >
          {isPending
            ? t("auth.register.submitting")
            : t("auth.register.submit")}
        </Button>
      </form>

      {state?.error && (
        <p className="mt-2 text-sm text-center text-red-500">{state.error}</p>
      )}
    </div>
  );
}
