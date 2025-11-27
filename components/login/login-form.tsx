// Login Form: components/login/login-form.jsx
"use client";

import { authenticate } from "@/lib/actions/loginActions";
import { AtSign, FileExclamationPoint, KeyIcon } from "lucide-react";
import { useActionState } from "react";
import { useState } from "react";
import SubmitButton from "../ui/submitButton";

export default function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="space-y-4 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg backdrop-blur-sm transition-colors duration-500">
      <form action={formAction} className="space-y-4">
        <h1
          className={` text-2xl font-semibold text-gray-900 dark:text-gray-100`}
        >
          Please log in to continue
        </h1>

        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium text-gray-900 dark:text-gray-200 mb-2"
          >
            Email
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-countyGreen transition"
            />
            <AtSign className="absolute left-3 top-1/2 h-[18px] w-[18px] transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-medium text-gray-900 dark:text-gray-200 mb-2"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="Enter password"
              className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-countyGreen transition"
            />
            <KeyIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <span
              onClick={togglePassword}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 dark:text-gray-400"
            >
              {showPassword ? "👁️" : "🙈"}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="flex items-center space-x-2 text-red-500">
            <FileExclamationPoint className="w-5 h-5" />
            <span className="text-sm">{errorMessage}</span>
          </div>
        )}

        <SubmitButton isPending={isPending} className="w-full" />
      </form>
    </div>
  );
}
