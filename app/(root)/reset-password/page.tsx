// app/reset-password/page.tsx

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { TokenCheckResult } from "@/lib/types/loginTypes";
import { checkResetToken } from "@/lib/actions/loginActions";
import ResetPasswordForm from "@/components/login/ResetPasswordForm";

const Page = async (props: {
  searchParams?: Promise<{
    token?: string;
  }>;
}) => {
  const searchParams = await props.searchParams;
  const token = searchParams?.token || "";

  const result: TokenCheckResult = await checkResetToken(token);

  // 1) No token at all
  if (result.reason === "no_token") {
    return (
      <CenteredMessage
        icon={<AlertCircle className="text-red-500 text-5xl mb-4" />}
        title="No Reset Token"
        message="We couldn’t find a reset token in your URL. Please request a new one."
      />
    );
  }

  // 2) Token not in DB
  if (result.reason === "not_found") {
    return (
      <CenteredMessage
        icon={<AlertCircle className="text-red-500 text-5xl mb-4" />}
        title="Invalid Token"
        message="This password reset link is not recognized."
      />
    );
  }

  // 3) Token expired
  if (result.reason === "expired") {
    const when = new Date(result.expiredAt).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return (
      <CenteredMessage
        icon={<AlertCircle className="text-red-500 text-5xl mb-4" />}
        title="Link Expired"
        message={`This link expired on ${when}. Please request a new password reset link.`}
      />
    );
  }

  // 4) Valid → show form
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <ResetPasswordForm token={token!} />
    </main>
  );
};
export default Page;

// Reusable centered panel
function CenteredMessage({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md text-center">
        {icon}
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="mb-6 text-gray-700 dark:text-gray-300">{message}</p>
        <Link
          href="/login"
          className="inline-block px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
        >
          Request New Link
        </Link>
      </div>
    </main>
  );
}
