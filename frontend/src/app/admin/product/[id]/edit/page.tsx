export const dynamic = 'force-dynamic';

import ClientProductEdit from './ClientProductEdit';

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientProductEdit productId={id} />;
}
