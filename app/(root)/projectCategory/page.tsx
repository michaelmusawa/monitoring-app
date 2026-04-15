import { auth } from "@/auth";
import CIDPCategoriesPage from "@/components/admin/CIDPCategoriesPage";
import { getUser } from "@/lib/actions/usersActions";

const Page = async () => {
  const session = await auth();
  const userEmail = session?.user?.email || "";

  const user = await getUser(userEmail);

  // Derive role once, pass everywhere
  const userRole =
    user?.sector === "Monitoring And Evaluation"
      ? "me"
      : user?.sector !== "Monitoring And Evaluation"
        ? "sector"
        : "viewer";

  return <CIDPCategoriesPage userRole={userRole} />;
};

export default Page;
