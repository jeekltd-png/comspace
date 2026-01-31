import { Schema } from 'mongoose';

// Interface for multi-language content
export interface IMultiLangContent {
  en: string;
  es?: string;
  fr?: string;
  ar?: string;
  de?: string;
  zh?: string;
  ja?: string;
  pt?: string;
  ru?: string;
  hi?: string;
}

// Update Product schema to support multi-language
const multiLangSchema = new Schema<IMultiLangContent>({
  en: { type: String, required: true },
  es: String,
  fr: String,
  ar: String,
  de: String,
  zh: String,
  ja: String,
  pt: String,
  ru: String,
  hi: String,
}, { _id: false });

// Example usage in Product model
export const ProductSchema = new Schema({
  // ... other fields ...
  name: {
    type: multiLangSchema,
    required: true,
  },
  description: {
    type: multiLangSchema,
    required: true,
  },
  shortDescription: multiLangSchema,
  metaTitle: multiLangSchema,
  metaDescription: multiLangSchema,
  // ... other fields ...
});

// Helper function to get content in user's language
export const getLocalizedContent = (
  content: IMultiLangContent,
  language: string = 'en'
): string => {
  // Normalize language code
  const lang = language.split('-')[0].toLowerCase();
  
  // Return content in requested language or fallback to English
  return content[lang as keyof IMultiLangContent] || content.en;
};

// Helper function to create multi-language content
export const createMultiLangContent = (englishText: string): IMultiLangContent => {
  return {
    en: englishText,
  };
};
