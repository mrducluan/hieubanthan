import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

export async function GET(req: Request) {
  (await draftMode()).disable();
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  redirect(/^[a-z0-9-]{1,120}$/.test(slug) ? `/blog/${slug}` : "/blog");
}
