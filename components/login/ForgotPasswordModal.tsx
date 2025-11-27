"use client";

import React, { useState, useEffect } from "react";
import { useActionState } from "react";
import { forgetPassword } from "@/app/lib/loginActions";
import SubmitButton from "../ui/SubmitButton";
import { ForgotPasswordActionState } from "@/app/lib/definitions";
import {
  FiMail,
  FiX,
  FiKey,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

export default function ForgotPasswordModal() {
  const [isOpen, setIsOpen] = useState(false);

  const initialState: ForgotPasswordActionState = {
    message: null,
    state_error: null,
    errors: {},
  };

  const [state, formAction, isPending] = useActionState(
    forgetPassword,
    initialState
  );

  useEffect(() => {
    if (isOpen) {
      state.message = null;
      state.state_error = null;
      state.errors = {};
    }
    // We know we only want to run this when `isOpen` changes,
    // and we're intentionally mutating the state object directly:
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
      >
        Forgot your password?
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700 animate-fade-in">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <FiKey className="text-green-600 dark:text-green-400 text-xl" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Reset Password
                  </h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FiX className="text-xl text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Success View */}
              {state.message && !state.state_error ? (
                <div className="text-center">
                  <FiCheckCircle className="mx-auto text-green-500 dark:text-green-400 text-4xl mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Success!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {state.message}
                  </p>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      state.message = null;
                    }}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  {/* Error Alert */}
                  {state.state_error && (
                    <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-start gap-3">
                      <FiAlertCircle className="flex-shrink-0 text-red-500 dark:text-red-400 text-xl" />
                      <div>
                        <p className="font-medium">{state.state_error}</p>
                      </div>
                    </div>
                  )}

                  {/* Form */}
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Enter your email address and we’ll send you a link to reset
                    your password.
                  </p>

                  <form action={formAction} className="space-y-5">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <FiMail className="text-gray-500" />
                        <span>Email Address</span>
                      </label>
                      <div className="relative">
                        <input
                          name="email"
                          type="email"
                          required
                          placeholder="you@example.com"
                          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                      </div>
                      {state.errors?.email && (
                        <p className="text-red-600 text-sm mt-1">
                          {state.errors.email[0]}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-300"
                      >
                        Cancel
                      </button>
                      <SubmitButton
                        isPending={isPending}
                        label={isPending ? "Sending..." : "Reset Password"}
                      />
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
