import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext.jsx';

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('../lib/api.js', () => ({
  default: apiMock,
  getApiErrorMessage: (error, fallback) => error?.response?.data?.error?.message ?? fallback,
}));

function Consumer() {
  const { user, status, login, logout } = useAuth();

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user?.name ?? ''}</span>
      <button type="button" onClick={() => login('ada@example.com', 'password123')}>
        Sign in
      </button>
      <button type="button" onClick={() => logout()}>
        Sign out
      </button>
    </div>
  );
}

beforeEach(() => {
  apiMock.get.mockReset();
  apiMock.post.mockReset();
});

describe('AuthContext', () => {
  it('restores an existing session from the API', async () => {
    apiMock.get.mockResolvedValueOnce({ data: { data: { user: { name: 'Restored User' } } } });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('Restored User');
    expect(apiMock.get).toHaveBeenCalledWith('/auth/me');
  });

  it('signs in through the login endpoint', async () => {
    apiMock.get.mockRejectedValueOnce(new Error('No session'));
    apiMock.post.mockResolvedValueOnce({ data: { data: { user: { name: 'Signed In' } } } });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('guest');
    });

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    });
    expect(apiMock.post).toHaveBeenCalledWith('/auth/login', {
      email: 'ada@example.com',
      password: 'password123',
    });
    expect(screen.getByTestId('user')).toHaveTextContent('Signed In');
  });

  it('clears local session state on logout', async () => {
    apiMock.get.mockResolvedValueOnce({ data: { data: { user: { name: 'Current User' } } } });
    apiMock.post.mockResolvedValueOnce(undefined);

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    });

    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('guest');
    });
    expect(apiMock.post).toHaveBeenCalledWith('/auth/logout');
    expect(screen.getByTestId('user')).toBeEmptyDOMElement();
  });
});
