import { useEffect, useState } from 'react';
import { authApi } from '@/api/auth';
import { tokenStorage } from '@/services/tokenStorage';
import { useAppDispatch } from '@/store/hooks';
import { setAuthenticated, clearAuth } from '@/store/authSlice';
import type { User } from '@/types';

/**
 * On cold start, restore the session from async storage. If a stored access
 * token fails validation, the API client will attempt one refresh rotation
 * before giving up.
 */
export function useBootstrap() {
  const [loading, setLoading] = useState(true);
  const dispatch = useAppDispatch();

  useEffect(() => {
    (async () => {
      try {
        const user = await tokenStorage.getUser<User>();
        const token = await tokenStorage.getAccessToken();
        if (user && token) {
          // Verify the token is still valid and pull fresh user data.
          try {
            const fresh = await authApi.me();
            dispatch(
              setAuthenticated({
                user: fresh,
                accessToken: token,
                refreshToken: (await tokenStorage.getRefreshToken()) ?? '',
                expiresAt: Date.now() + 15 * 60 * 1000,
              })
            );
          } catch {
            // Token invalid and refresh failed — fall through to signed-out.
          }
        }
      } catch {
        // No stored session.
      } finally {
        // Always move status away from 'idle' so the navigator can proceed.
        dispatch(clearAuth());
        setLoading(false);
      }
    })();
  }, [dispatch]);

  return { loading };
}
