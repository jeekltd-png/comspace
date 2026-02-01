// Server wrapper to force dynamic rendering and avoid prerender errors
export const dynamic = 'force-dynamic';

import ClientProductCreate from './ClientProductCreate';

export default function Page() {
  return <ClientProductCreate />;
}
