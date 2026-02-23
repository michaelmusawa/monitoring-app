// components/ui/ArchiveUserForm.tsx
"use client";

import React from "react";
import { useActionState } from "react";

import { Trash2, X } from "lucide-react";
import { archiveUser } from "@/lib/actions/usersActions";
import { initialUserActionState } from "@/lib/types/userTypes";
import SubmitButton from "../customUI/SubmitButton";

interface ArchiveUserFormProps {
  userId: number;
}

export default function ArchiveUserForm({ userId }: ArchiveUserFormProps) {
  const [open, setOpen] = React.useState(false);

  const [state, formAction, isLoading] = useActionState(
    archiveUser,
    initialUserActionState,
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 transition-colors"
        aria-label="Archive user"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Trash2 className="text-red-500" />
                  Archive User?
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <X className="text-xl text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <p className="mb-5 text-center text-gray-700 dark:text-gray-300 text-wrap">
                Are you sure you want to archive this user? They will no longer
                be able to log in.
              </p>

              {/* Messages with proper wrapping */}
              {state.state_error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm break-words">
                  {state.state_error}
                </div>
              )}

              {state.message && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm break-words">
                  {state.message}
                </div>
              )}

              <form action={formAction} className="flex flex-wrap gap-3">
                <input type="hidden" name="userId" value={userId} />

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                  className="flex-1 min-w-[100px] px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>

                <SubmitButton
                  isPending={isLoading}
                  label="Archive"
                  className="flex-1 min-w-[100px] px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-lg"
                />
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
