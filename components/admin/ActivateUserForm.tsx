// components/ui/ActivateUserForm.tsx
"use client";

import React from "react";
import { useActionState } from "react";

import { UserCheck } from "lucide-react";
import { activateUser } from "@/lib/actions/usersActions";
import SubmitButton from "../customUI/SubmitButton";

export default function ActivateUserForm({ userId }: { userId: number }) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, isPending] = useActionState(activateUser, {
    message: null,
    state_error: null,
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors"
        title="Activate User"
      >
        <UserCheck className="w-4 h-4" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="text-green-500 text-xl" />
              <h3 className="text-lg font-semibold dark:text-white">
                Activate User
              </h3>
            </div>

            {state?.state_error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
                {state.state_error}
              </div>
            )}

            <p className="mb-5 text-center text-gray-700 dark:text-gray-300 text-wrap">
              Are you sure you want to activate this user? They will regain
              access to the system.
            </p>

            <form action={formAction} className="flex justify-end gap-3">
              <input type="hidden" name="userId" value={userId} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <SubmitButton
                isPending={isPending}
                label="Activate"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              />
            </form>
          </div>
        </div>
      )}
    </>
  );
}
