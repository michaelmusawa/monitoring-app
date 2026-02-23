"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useActionState } from "react";
import { User as UserIcon, Mail, X, Plus, Pencil, Check } from "lucide-react";
import { User, UserActionState } from "@/lib/types/userTypes";
import { addUser, updateUser } from "@/lib/actions/usersActions";
import SubmitButton from "../customUI/SubmitButton";
import { Globe } from "lucide-react";

interface AddUserModalProps {
  user?: User;
}

export default function AddUserModal({ user }: AddUserModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const initialState: UserActionState = {
    message: null,
    state_error: null,
    errors: {},
  };
  const action = user ? updateUser : addUser;
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [showSuccess, setShowSuccess] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  // Memoized close function
  const closeModal = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setShowSuccess(false);
      setIsClosing(false);
    }, 300); // Match CSS transition duration
  }, []);

  // Auto-close on success
  useEffect(() => {
    if (isOpen && state.message && !state.state_error) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        closeModal();
        state.message = null; // Clear message after showing
      }, 2500); // Close after 2.5 seconds
      return () => clearTimeout(timer);
    }
  }, [state, isOpen, closeModal]);

  // Reset state when reopening
  const openModal = useCallback(() => {
    setModalKey((k) => k + 1);
    setIsOpen(true);
    setShowSuccess(false);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeModal();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeModal]);

  return (
    <>
      <button
        onClick={openModal}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow transition-all hover:shadow-md

            bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white
        `}
      >
        {user ? <Pencil className="text-lg" /> : <Plus className="text-lg" />}
        <span>{user ? `Edit user` : `Add user`}</span>
      </button>

      {isOpen && (
        <div
          key={modalKey}
          className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4
            ${
              isClosing ? "opacity-0" : "opacity-100"
            } transition-opacity duration-300`}
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div
            className={`bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700
              ${
                isClosing ? "scale-95" : "scale-100"
              } transition-transform duration-300`}
          >
            <div className="p-6">
              {!showSuccess ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {user ? (
                        <Pencil className="text-yellow-500" />
                      ) : (
                        <Plus className="text-yellow-500" />
                      )}
                      <span>{user ? `Edit user` : `Add user`}</span>
                    </h2>
                    <button
                      onClick={closeModal}
                      className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      disabled={isPending}
                    >
                      <X className="text-xl text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>

                  {state.state_error && (
                    <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
                      {state.state_error}
                    </div>
                  )}

                  <form action={formAction} className="space-y-5">
                    {user && (
                      <input type="hidden" name="userId" value={user.id} />
                    )}

                    {/* Name & Email */}
                    <div className="grid grid-cols-1 gap-5">
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <UserIcon className="text-gray-500" />
                          <span>Full Name</span>
                        </label>
                        <div className="relative">
                          <input
                            name="name"
                            type="text"
                            required
                            defaultValue={user?.name || ""}
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="John Doe"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Mail className="text-gray-500" />
                          <span>Email Address</span>
                        </label>
                        <div className="relative">
                          <input
                            name="email"
                            type="email"
                            required
                            defaultValue={user?.email || ""}
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="user@example.com"
                          />
                          {state.errors?.email && (
                            <p className="text-red-600 text-sm mt-1">
                              {state.errors.email[0]}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Globe className="text-gray-500" />
                            <span>Sector</span>
                          </label>
                          <div className="relative">
                            <input
                              name="sector"
                              type="text"
                              required
                              defaultValue={user?.sector || ""}
                              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                              placeholder="user@example.com"
                            />
                            {state.errors?.sector && (
                              <p className="text-red-600 text-sm mt-1">
                                {state.errors.sector[0]}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Globe className="text-gray-500" />
                            <span>Role</span>
                          </label>
                          <div className="relative">
                            <input
                              name="role"
                              type="text"
                              required
                              defaultValue={user?.role || ""}
                              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                              placeholder="user@example.com"
                            />
                            {state.errors?.role && (
                              <p className="text-red-600 text-sm mt-1">
                                {state.errors.role[0]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={close}
                        className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-300"
                      >
                        Cancel
                      </button>
                      <SubmitButton
                        isPending={isPending}
                        label={user ? "Update User" : "Create User"}
                        className={
                          "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        }
                      />
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {user ? "User Updated" : "User Created"}
                  </h3>
                  <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
                    {state.message}
                  </div>
                  <div className="flex justify-center mt-4">
                    <div className="relative h-2 w-48 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 via-green-400 to-amber-500 transition-all duration-2500 ease-linear"
                        style={{ width: "0%" }}
                        ref={(el) => {
                          if (el) {
                            // Reset and restart animation
                            el.style.width = "0%";
                            setTimeout(() => {
                              el.style.width = "100%";
                            }, 10);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Closing automatically...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
