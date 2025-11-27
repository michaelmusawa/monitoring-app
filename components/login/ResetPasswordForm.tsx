// components/auth/ResetPasswordForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import resetPasswordHandler from "@/app/lib/loginActions";
import SubmitButton from "../ui/SubmitButton";
import { ResetPasswordActionState } from "@/app/lib/definitions";
import {
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiX,
} from "react-icons/fi";

interface Props {
  token: string;
}

export default function ResetPasswordForm({ token }: Props) {
  const router = useRouter();
  const initialState: ResetPasswordActionState = {
    message: null,
    state_error: null,
    errors: {},
  };

  const [state, formAction, isPending] = useActionState(
    resetPasswordHandler,
    initialState
  );

  // Local flag to indicate we've shown the success view
  const isSuccess = Boolean(state.message && !state.state_error);

  // Redirect on success after a short delay
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => router.push("/login"), 1500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, router]);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-all transform hover:shadow-2xl">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-green-600 to-green-800" />

        <div className="p-8">
          {/* Close button (optional) */}
          {!isSuccess && (
            <button
              onClick={() => router.push("/login")}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Cancel"
            >
              <FiX className="text-gray-500 dark:text-gray-400 w-5 h-5" />
            </button>
          )}

          {/* Success View */}
          {isSuccess ? (
            <div className="text-center py-12">
              <FiCheckCircle className="mx-auto text-green-500 dark:text-green-400 text-5xl mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Password Updated
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {state.message}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Redirecting to login...
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                  <FiLock className="w-8 h-8 text-green-500 dark:text-green-700" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Set New Password
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Create a strong, secure password
                </p>
              </div>

              {/* Error Alert */}
              {state.state_error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-start gap-3">
                  <FiAlertCircle className="w-6 h-6 text-red-500 dark:text-red-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-700 dark:text-red-300">
                      Password Reset Failed
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {state.state_error}
                    </p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form action={formAction} className="space-y-6">
                <input type="hidden" name="token" value={token} />

                {/* New Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <FiEyeOff className="h-5 w-5" />
                      ) : (
                        <FiEye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {state.errors?.password && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <FiAlertCircle className="w-4 h-4" />
                      {state.errors.password[0]}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff className="h-5 w-5" />
                      ) : (
                        <FiEye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {state.errors?.confirmPassword && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <FiAlertCircle className="w-4 h-4" />
                      {state.errors.confirmPassword[0]}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <div className="mt-8">
                  <SubmitButton
                    isPending={isPending}
                    label={isPending ? "Updating..." : "Reset Password"}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3.5 rounded-lg font-medium transition-all transform hover:-translate-y-0.5 focus:translate-y-0"
                  />
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
