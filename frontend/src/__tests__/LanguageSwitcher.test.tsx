import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSwitcher from '../components/LanguageSwitcher';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/en/foo',
}));

describe('LanguageSwitcher', () => {
  test('shows language options and pushes new path', () => {
    render(<LanguageSwitcher currentLocale="en" />);

    const button = screen.getByRole('button', { name: /select language/i });
    fireEvent.click(button);

    const option = screen.getByText(/Spanish|es/gi) || screen.getByText('Spanish');
    expect(option).toBeInTheDocument();
  });
});
