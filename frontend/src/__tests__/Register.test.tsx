import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientRegister from '../app/register/ClientRegister';

jest.mock('../lib/api', () => ({
  post: jest.fn().mockResolvedValue({ data: { success: true } }),
}));

// next-intl requires a provider; mock useTranslations for unit tests
jest.mock('next-intl', () => ({
  useTranslations: () => ((s: string) => s),
}));

describe('Register form', () => {
  test('renders and submits successfully', async () => {
    render(<ClientRegister />);

    // Labels come from translations (we mock useTranslations to return keys like 'auth.firstName')
    fireEvent.change(screen.getByLabelText(/auth.firstName/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/auth.lastName/i), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText(/auth.email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/auth.password/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/auth.confirmPassword/i), { target: { value: 'Password123!' } });

    fireEvent.click(screen.getByRole('button', { name: /save|creating|create/i }));

    await waitFor(() => expect(screen.getByText(/Account created — please check your email to verify\.|check your email/i)).toBeInTheDocument());
  });
});
