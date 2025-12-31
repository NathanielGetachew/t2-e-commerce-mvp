import { redirect } from "next/navigation"
import { getUser } from "../auth/actions"

export default async function AdminPage() {
  const user = await getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const isAdmin = user.role === "admin" || user.role === "super-admin"

  if (!isAdmin) {
    redirect("/")
  }

  redirect("/?tab=admin")
}
