import { auth } from "@/auth";
import SettingsPage from "@/components/settings/SettingClientPage";

const Page = async () => {
  const session = await auth();

  const userEmail = session?.user?.email || "";

  return <SettingsPage userEmail={userEmail} />;
};

export default Page;
