'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import apiClient from '@/lib/api';
import { cmsPageSchema, type CmsPageFormData } from '@/lib/validations';
import RichTextEditor from '@/components/RichTextEditor';
import { FiSave, FiEye, FiCode } from 'react-icons/fi';

export default function ClientPageEditor({ page }: { page?: any }) {
  const [mode, setMode] = useState<'visual' | 'html'>('visual');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CmsPageFormData>({
    resolver: zodResolver(cmsPageSchema),
    defaultValues: {
      title: page?.title || '',
      slug: page?.slug || '',
      body: page?.body || '',
      published: page?.published || false,
    },
  });

  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (data: CmsPageFormData) => {
    setMessage(null);
    try {
      if (page?.id) {
        await apiClient.put(`/api/pages/${page.id}`, data);
      } else {
        await apiClient.post('/api/pages', data);
      }
      setMessage('Saved successfully');
    } catch (err: any) {
      setMessage(err?.response?.data?.message || err?.message || 'Save failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title & Slug */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            {...register('title')}
            className={`input-field ${errors.title ? 'border-red-400' : ''}`}
            placeholder="Page title"
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            id="slug"
            {...register('slug')}
            className={`input-field font-mono ${errors.slug ? 'border-red-400' : ''}`}
            placeholder="page-slug"
          />
          {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug.message}</p>}
        </div>
      </div>

      {/* Body — rich text editor with HTML fallback */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Body <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-surface-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setMode('visual')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === 'visual'
                  ? 'bg-white dark:bg-surface-700 text-brand-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiEye className="w-3 h-3" /> Visual
            </button>
            <button
              type="button"
              onClick={() => setMode('html')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === 'html'
                  ? 'bg-white dark:bg-surface-700 text-brand-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiCode className="w-3 h-3" /> HTML
            </button>
          </div>
        </div>

        <Controller
          name="body"
          control={control}
          render={({ field }) =>
            mode === 'visual' ? (
              <RichTextEditor
                content={field.value}
                onChange={field.onChange}
                placeholder="Start writing your page content..."
              />
            ) : (
              <textarea
                rows={12}
                value={field.value}
                onChange={field.onChange}
                className="input-field font-mono text-sm"
                placeholder="<h1>Your HTML here</h1>"
              />
            )
          }
        />
        {errors.body && <p className="text-xs text-red-500 mt-1">{errors.body.message}</p>}
      </div>

      {/* Published */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          {...register('published')}
          className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Published</span>
      </label>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <FiSave className="w-4 h-4" />
              {page?.id ? 'Update Page' : 'Create Page'}
            </>
          )}
        </button>
        {message && (
          <p className={`text-sm ${message === 'Saved successfully' ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>
    </form>
  );
}