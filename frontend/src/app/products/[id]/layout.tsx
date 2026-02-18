import type { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${API_URL}/products/${id}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      return {
        title: 'Product Not Found | ComSpace',
        description: 'This product could not be found.',
      };
    }

    const json = await res.json();
    const product = json.data?.product || json.data;

    const title = `${product.name} | ComSpace`;
    const description =
      product.shortDescription ||
      product.description?.slice(0, 160) ||
      `Buy ${product.name} at the best price on ComSpace.`;
    const image = product.images?.[0]?.url;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        images: image ? [{ url: image, width: 800, height: 600, alt: product.name }] : [],
        siteName: 'ComSpace',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: image ? [image] : [],
      },
      other: {
        'product:price:amount': String(product.basePrice || ''),
        'product:price:currency': 'USD',
        'product:availability': product.stock > 0 ? 'in stock' : 'out of stock',
      },
    };
  } catch {
    return {
      title: 'Product | ComSpace',
      description: 'Shop the best products on ComSpace.',
    };
  }
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
