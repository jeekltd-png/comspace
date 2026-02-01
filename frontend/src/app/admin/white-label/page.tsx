// Server wrapper to force dynamic rendering and avoid prerender errors
export const dynamic = 'force-dynamic';

import ClientWhiteLabel from './ClientWhiteLabel';

export default function Page() {
  return <ClientWhiteLabel />;
}
