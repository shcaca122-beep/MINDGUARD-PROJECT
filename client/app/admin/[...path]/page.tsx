import { redirect } from 'next/navigation';

export default async function AdminRouteAlias({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  redirect(`/admin1/${path.map(encodeURIComponent).join('/')}`);
}
