import { auth } from "@/auth";
import SettingsPage from "@/components/settings/SettingClientPage";

const Page = async () => {
  const session = await auth();

  const userEmail = session?.user?.email || "";

  console.log("user email", userEmail);

  return <SettingsPage userEmail={userEmail} />;
};

export default Page;
