import type { FormEvent } from "react";
import React from "react";
import { AlertCircle } from "lucide-react";

interface FormProps {
  children: React.ReactNode;
  onSubmit: (e: FormEvent) => void;
  className?: string;
}

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  help?: string;
  children: React.ReactNode;
}

interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string | number; label: string }>;
  error?: string;
  placeholder?: string;
}

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

interface FormButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
}

interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Form - Main form wrapper
 */
export const Form: React.FC<FormProps> = ({
  children,
  onSubmit,
  className = "",
}) => (
  <form onSubmit={onSubmit} className={`space-y-6 ${className}`}>
    {children}
  </form>
);

/**
 * FormField - Wrapper for form inputs with label and error
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required,
  help,
  children,
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
      {label}
      {required && <span className="text-red-600 ml-1">*</span>}
    </label>
    {children}
    {error && (
      <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
        <AlertCircle className="w-4 h-4" />
        {error}
      </div>
    )}
    {help && !error && (
      <p className="text-sm text-gray-500 dark:text-gray-400">{help}</p>
    )}
  </div>
);

/**
 * FormInput - Reusable text input field
 */
export const FormInput: React.FC<FormInputProps> = ({
  error,
  className = "",
  ...props
}) => (
  <input
    className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors
      ${
        error
          ? "border-red-500 dark:border-red-500 focus:ring-red-500"
          : "border-gray-300 dark:border-gray-600 focus:ring-emerald-500"
      }
      bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100
      focus:outline-none focus:ring-2
      ${className}`}
    {...props}
  />
);

/**
 * FormSelect - Reusable select field
 */
export const FormSelect: React.FC<FormSelectProps> = ({
  options,
  error,
  placeholder,
  className = "",
  ...props
}) => (
  <select
    className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors
      ${
        error
          ? "border-red-500 dark:border-red-500 focus:ring-red-500"
          : "border-gray-300 dark:border-gray-600 focus:ring-emerald-500"
      }
      bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100
      focus:outline-none focus:ring-2
      ${className}`}
    {...props}
  >
    {placeholder && (
      <option value="" disabled>
        {placeholder}
      </option>
    )}
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

/**
 * FormTextarea - Reusable textarea field
 */
export const FormTextarea: React.FC<FormTextareaProps> = ({
  error,
  className = "",
  ...props
}) => (
  <textarea
    className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors
      ${
        error
          ? "border-red-500 dark:border-red-500 focus:ring-red-500"
          : "border-gray-300 dark:border-gray-600 focus:ring-emerald-500"
      }
      bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100
      focus:outline-none focus:ring-2 resize-none
      ${className}`}
    {...props}
  />
);

/**
 * FormButton - Reusable form submit button
 */
export const FormButton: React.FC<FormButtonProps> = ({
  loading,
  children,
  variant = "primary",
  className = "",
  disabled,
  ...props
}) => {
  const variantClass = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white",
    secondary:
      "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors
        ${variantClass[variant]}
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}`}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  );
};

/**
 * FormGroup - Group multiple form fields
 */
export const FormGroup: React.FC<FormGroupProps> = ({
  children,
  className = "",
}) => <div className={`space-y-4 ${className}`}>{children}</div>;

/**
 * FormRow - Create a grid layout for form fields
 */
export const FormRow: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className="grid grid-cols-2 gap-4">{children}</div>;

export default Form;
