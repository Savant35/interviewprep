import Link from "next/link";
import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { isAuthenticated, signOut } from "@/lib/actions/auth.action";

const Layout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = await isAuthenticated();
  if (!isUserAuthenticated) redirect("/sign-in");

  // This is your Server Action
  async function logout() {
    "use server";
    await signOut();
    redirect("/sign-in");
  }

  return (
    <div className="root-layout">
      <nav className="flex justify-between items-center p-4">
        <Link href="/" className="flex items-center gap-2">
          <h2 className="text-primary-100">InterviewPrep</h2>
        </Link>

        {/* form with action pointing at our server action */}
        <form action={logout}>
          <button
            type="submit"
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </form>
      </nav>

      {children}
    </div>
  );
};

export default Layout;
