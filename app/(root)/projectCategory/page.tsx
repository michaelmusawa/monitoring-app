import { auth } from "@/auth";
import CIDPCategoriesPage from "@/components/admin/CIDPCategoriesPage";
import { getUser } from "@/lib/actions/usersActions";

const Page = async () => {
  const session = await auth();
  const userEmail = session?.user?.email || "";

  const user = await getUser(userEmail);

  console.log("user", user);

  // Derive role once, pass everywhere
  const userRole =
    user?.sector === "me" ? "me" : user?.sector === "IDE" ? "sector" : "viewer";

  return <CIDPCategoriesPage userRole={userRole} />;
};

export default Page;
