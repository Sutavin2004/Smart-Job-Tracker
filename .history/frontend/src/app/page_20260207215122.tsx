import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("refresh_token");

  if (sessionCookie) {
    redirect("/dashboard");
  }

  redirect("/login");
}
