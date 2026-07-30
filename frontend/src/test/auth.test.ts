import { describe, it, expect, vi } from 'vitest';

vi.mock('../services/apiClient', () => ({
  apiClient: {
    post: vi.fn((url: string, body: { email: string; password: string }) => {
      if (
        url === '/auth/login' &&
        body.email === 'admin@aiish.demo' &&
        body.password === 'password123'
      ) {
        return Promise.resolve({
          data: {
            id: 'u1',
            email: body.email,
            fullName: 'Admin User',
            role: 'admin',
            hospitalId: 'h1',
          },
        });
      }
      // Mirrors apiClient's response interceptor, which normalizes backend errors to plain Errors.
      return Promise.reject(new Error('Invalid credentials'));
    }),
  },
}));

const { authService } = await import('../services/api/authService');

describe('Auth Service', () => {
  it('should login with correct credentials', async () => {
    const user = await authService.login('admin@aiish.demo', 'password123');
    expect(user.role).toBe('admin');
  });

  it('should fail with incorrect credentials', async () => {
    await expect(authService.login('wrong@aiish.demo', 'pass')).rejects.toThrow(
      'Invalid credentials',
    );
  });
});
