// Server wrapper to force dynamic rendering and avoid prerender errors
export const dynamic = 'force-dynamic';

import ClientRegister from './ClientRegister';

export default function Page() {
  return <ClientRegister />;
}
