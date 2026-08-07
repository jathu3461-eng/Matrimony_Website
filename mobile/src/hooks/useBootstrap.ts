import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '@/api/auth';
import { useAppDispatch } from '@/store/hooks';
import { setAuthenticated, clearAuth } from '@/store/authSlice';

export function useBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Move status away from 'idle' immediately so the splash can dismiss.
    dispatch(clearAuth());

    let cancelled = false;

    (async () => {
      try {
        const [userJson, token, onboarded] = await Promise.all([
          AsyncStorage.getItem('mukurtham_user'),
          AsyncStorage.getItem('mukurtham_access_token'),
          AsyncStorage.getItem('mukurtham_onboarding_done'),
        ]);

        if (cancelled) return;

        // No stored session — already dispatched clearAuth above.
        if (!userJson || !token || !onboarded) return;

        // Try to restore session from the server.
        try {
          const fresh = await authApi.me();
          if (!cancelled) {
            dispatch(
              setAuthenticated({
                user: fresh,
                accessToken: token,
                refreshToken: (await AsyncStorage.getItem('mukurtham_refresh_token')) ?? '',
                expiresAt: Date.now() + 15 * 60 * 1000,
              })
            );
          }
        } catch {
          // Token invalid or server unreachable — already cleared above.
        }
      } catch {
        // AsyncStorage error — already cleared above.
      }
    })();

    return () => { cancelled = true; };
  }, [dispatch]);
}
