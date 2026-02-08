import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function RootPage() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("refresh_token");

  if (sessionCookie) {
    redirect("/dashboard");
  }

  redirect("/login");
}
