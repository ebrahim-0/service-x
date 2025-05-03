"use client";

import { Control, FieldValues, Path, useController } from "react-hook-form";
import { Label } from "./label";
import { Input } from "./input";
import { PasswordInput } from "./password-input";
import { Checkbox } from "./checkbox";
import { cn } from "@/lib/utils";

interface FormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  placeholder,
  disabled,
  className,
}: FormFieldProps<T>) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  if (type === "checkbox") {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Checkbox
          id={name}
          checked={field.value}
          onCheckedChange={field.onChange}
          disabled={disabled}
        />
        {label && (
          <Label htmlFor={name} className="text-sm">
            {label}
          </Label>
        )}
        {error?.message && (
          <p className="text-sm text-red-500">{error.message}</p>
        )}
      </div>
    );
  }

  const InputComponent = type === "password" ? PasswordInput : Input;
  const inputProps =
    type === "password"
      ? { placeholder, disabled }
      : { type, placeholder, disabled };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label htmlFor={name}>{label}</Label>}
      <InputComponent {...field} {...inputProps} id={name} />
      {error?.message && (
        <p className="text-sm text-red-500">{error.message}</p>
      )}
    </div>
  );
}
