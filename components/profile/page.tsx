"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useActionState } from "react";

import Image from "next/image";
import {
  User as UserIcon,
  Image as ImageIcon,
  Lock,
  X,
  Eye,
  EyeOff,
  Check,
  Key,
} from "lucide-react";
import { User } from "@/lib/types/userTypes";
import { updateProfile, verifyPassword } from "@/lib/actions/profileActions";
import SubmitButton from "../customUI/SubmitButton";

interface EditProfileModalProps {
  user: User;
}

type PasswordChangeStage = "init" | "verify" | "change" | "success";

export default function EditProfileModal({ user }: EditProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [passwordChangeStage, setPasswordChangeStage] =
    useState<PasswordChangeStage>("init");
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );
  const [currentPassword, setCurrentPassword] = useState("");

  const initialState = {
    errors: {} as Record<string, string[]>,
    state_error: null,
    message: null,
  };

  const [state, formAction, isPending] = useActionState(
    updateProfile,
    initialState,
  );

  // Only for edit: avatar file + preview URL
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.image || null,
  );

  // When an avatarFile is selected, generate a data-URL preview
  useEffect(() => {
    if (!avatarFile) {
      return setAvatarPreview(user?.image || null);
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(avatarFile);
  }, [avatarFile, user]);

  const resetPasswordFlow = useCallback(() => {
    setPasswordChangeStage("init");
    setCurrentPassword("");
    setVerificationError(null);
    setNewPassword("");
    setConfirmPassword("");
  }, []);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Close modal with animation
  const closeModal = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setShowSuccess(false);
      setIsClosing(false);
      resetPasswordFlow();
      setAvatarFile(null);
      setAvatarPreview(user?.image || null);
    }, 300);
  }, [user?.image, resetPasswordFlow]);

  // Open modal with reset
  const openModal = useCallback(() => {
    setModalKey((prev) => prev + 1);
    setIsOpen(true);
    setShowSuccess(false);
    resetPasswordFlow();
    setAvatarFile(null);
    setAvatarPreview(user?.image || null);
  }, [user?.image, resetPasswordFlow]);

  const handleVerifyPassword = async () => {
    if (!currentPassword) {
      setVerificationError("Please enter your current password");
      return;
    }

    try {
      const isValid = await verifyPassword(user.email, currentPassword);
      if (isValid) {
        setPasswordChangeStage("change");
        setVerificationError(null);
      } else {
        setVerificationError("Incorrect password. Please try again.");
      }
    } catch (error) {
      console.log(error);
      setVerificationError("Verification failed. Please try again.");
    }
  };

  // Auto-close on success
  useEffect(() => {
    if (isOpen && state.message && !state.state_error) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        closeModal();
        state.message = null; // Clear message after showing
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [state, isOpen, closeModal]);

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
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-300 to-green-700 hover:from-green-600 hover:to-green-400 text-white rounded-lg shadow transition-all hover:shadow-md"
      >
        <UserIcon className="text-lg" />
        <span>Edit Profile</span>
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
              {showSuccess ? (
                <div className="text-center py-6">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Profile Updated
                  </h3>
                  <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
                    {state.message}
                  </div>
                  {/* Animated Progress Bar */}
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
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <UserIcon className="text-yellow-500" />
                        <span>Edit Profile</span>
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Update your account information
                      </p>
                    </div>
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
                    <input type="hidden" name="id" value={user.id} />
                    <input type="hidden" name="name" value={user.name} />

                    {/* Avatar picker */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <ImageIcon className="text-gray-500" />
                        <span>Profile Image</span>
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          {avatarPreview ? (
                            <Image
                              src={avatarPreview}
                              alt="avatar preview"
                              width={200}
                              height={200}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              —
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          name="image"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            setAvatarFile(file);
                          }}
                        />
                        {state.errors?.image && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {state.errors.image[0]}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Name field */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <UserIcon className="text-gray-500" />
                        <span>Full Name</span>
                      </label>
                      <div className="relative">
                        <input
                          name="name"
                          defaultValue={user.name ?? ""}
                          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition cursor-not-allowed"
                          placeholder="Alicia Kanini"
                          disabled
                        />
                      </div>
                      {state.errors?.name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {state.errors.name[0]}
                        </p>
                      )}
                    </div>

                    {/* Password Change Flow */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      {passwordChangeStage === "init" ? (
                        <div className="flex flex-col gap-3">
                          <button
                            type="button"
                            onClick={() => setPasswordChangeStage("verify")}
                            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            <Key className="text-lg" />
                            <span>Change Password</span>
                          </button>
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            You&apos;ll be asked to verify your current password
                            first
                          </p>
                        </div>
                      ) : passwordChangeStage === "verify" ? (
                        <div className="space-y-4">
                          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <Key className="text-blue-500" />
                            <span>Verify Your Identity</span>
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            For security, please confirm your current password
                          </p>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Current Password
                            </label>
                            <div className="relative">
                              <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) =>
                                  setCurrentPassword(e.target.value)
                                }
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 pl-10 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                placeholder="Enter your current password"
                              />
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowCurrentPassword(!showCurrentPassword)
                                }
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                              >
                                {showCurrentPassword ? <EyeOff /> : <Eye />}
                              </button>
                            </div>
                            {verificationError && (
                              <p className="text-red-600 dark:text-red-400 text-sm">
                                {verificationError}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-3 pt-2">
                            <button
                              type="button"
                              onClick={handleVerifyPassword}
                              className="flex-1 py-2.5 bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors"
                            >
                              Verify Password
                            </button>
                            <button
                              type="button"
                              onClick={resetPasswordFlow}
                              className="flex-1 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        passwordChangeStage === "change" && (
                          <div className="space-y-4">
                            <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              <Key className="text-green-500" />
                              <span>Set New Password</span>
                            </h3>

                            {passwordChangeStage === "change" && (
                              <input
                                type="hidden"
                                name="currentPassword"
                                value={currentPassword}
                                readOnly
                              />
                            )}

                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                New Password
                              </label>
                              <div className="relative">
                                <input
                                  name="password"
                                  type={showPassword ? "text" : "password"}
                                  value={newPassword}
                                  onChange={(e) =>
                                    setNewPassword(e.target.value)
                                  }
                                  placeholder="Create a new password"
                                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 pl-10 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                  minLength={6}
                                />
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                  {showPassword ? <EyeOff /> : <Eye />}
                                </button>
                              </div>
                              {state.errors?.password && (
                                <p className="text-red-600 dark:text-red-400 text-sm">
                                  {state.errors.password[0]}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Confirm New Password
                              </label>
                              <div className="relative">
                                <input
                                  name="confirmPassword"
                                  type={
                                    showConfirmPassword ? "text" : "password"
                                  }
                                  value={confirmPassword}
                                  onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                  }
                                  placeholder="Confirm your new password"
                                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 pl-10 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                  minLength={6}
                                />
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                  }
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                                </button>
                              </div>
                              {state.errors?.confirmPassword && (
                                <p className="text-red-600 dark:text-red-400 text-sm">
                                  {state.errors.confirmPassword[0]}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {passwordChangeStage !== "verify" && (
                      <div className="flex justify-end space-x-3 pt-2">
                        {passwordChangeStage === "change" ? (
                          <button
                            type="button"
                            onClick={resetPasswordFlow}
                            className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={closeModal}
                            className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-300"
                          >
                            Cancel
                          </button>
                        )}

                        <SubmitButton
                          isPending={isPending}
                          label="Update Profile"
                          className="bg-gradient-to-r from-green-300 to-green-700 hover:from-green-600 hover:to-green-400"
                        />
                      </div>
                    )}
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
