import React from 'react';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

async function getPage(slug: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/pages/${slug}`);
  if (!res.ok) return null;
  return res.json().then((r) => r.data);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{page.title}</h1>
      {page.heroImage?.url && <img src={page.heroImage.url} alt={page.heroImage.alt || page.title} className="w-full h-64 object-cover mb-4" />}
      <div className="prose">
        <ReactMarkdown>{page.body}</ReactMarkdown>
      </div>
    </div>
  );
}
