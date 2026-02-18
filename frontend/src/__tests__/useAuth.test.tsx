import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../lib/useAuth';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockDispatch = jest.fn();
jest.mock('../store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: jest.fn((selector: any) => selector({ auth: { user: null, token: null } })),
}));

jest.mock('../store/slices/authSlice', () => ({
  setCredentials: jest.fn((payload: any) => ({ type: 'auth/setCredentials', payload })),
  logout: jest.fn(() => ({ type: 'auth/logout' })),
}));

const mockGet = jest.fn();
jest.mock('../lib/api', () => ({
  __esModule: true,
  default: { get: (...args: any[]) => mockGet(...args) },
}));

// Prevent jsdom navigation errors
delete (window as any).location;
(window as any).location = { href: '' };

// ── Test helper component ──────────────────────────────────────────────────

function TestConsumer() {
  const { user, loading, login, logout } = useAuth();
  return (
    <div>
      <p data-testid="loading">{loading ? 'loading' : 'ready'}</p>
      <p data-testid="user">{user ? (user as any).email : 'no-user'}</p>
      <button onClick={() => login('tok', 'rtok')}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('AuthProvider + useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (window as any).location.href = '';
  });

  it('starts in loading state then becomes ready when no token', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  it('fetches user on mount if token exists in localStorage', async () => {
    localStorage.setItem('token', 'existing-token');
    mockGet.mockResolvedValueOnce({
      data: { data: { user: { email: 'test@example.com', role: 'customer' } } },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('test@example.com'));
    expect(mockGet).toHaveBeenCalledWith('/auth/me');
  });

  it('clears tokens when /auth/me fails', async () => {
    localStorage.setItem('token', 'bad-token');
    mockGet.mockRejectedValueOnce(new Error('Unauthorized'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  it('login() stores tokens and fetches user', async () => {
    mockGet.mockResolvedValueOnce({
      data: { data: { user: { email: 'new@example.com', role: 'customer' } } },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));

    await act(async () => {
      screen.getByText('login').click();
    });

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('new@example.com'));
    expect(localStorage.getItem('token')).toBe('tok');
    expect(localStorage.getItem('refreshToken')).toBe('rtok');
  });

  it('logout() clears everything and redirects to /login', async () => {
    localStorage.setItem('token', 'tok');
    mockGet.mockResolvedValueOnce({
      data: { data: { user: { email: 'bye@example.com', role: 'customer' } } },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('bye@example.com'));

    await act(async () => {
      screen.getByText('logout').click();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(window.location.href).toBe('/login');
  });

  it('useAuth() throws outside AuthProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      'useAuth must be used within AuthProvider'
    );

    spy.mockRestore();
  });
});
