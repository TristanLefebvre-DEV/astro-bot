import DashboardClient from "./ui/DashboardClient";
import { getSession } from "../lib/auth";

export default async function Page() {
  const session = await getSession();
  return <DashboardClient initialUser={session?.user ?? null} />;
}
