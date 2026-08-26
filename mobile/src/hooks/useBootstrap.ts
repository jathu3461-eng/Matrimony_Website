import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '@/api/auth';
import { useAppDispatch } from '@/store/hooks';
import { setAuthenticated, clearAuth } from '@/store/authSlice';

export function useBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [userJson, token, onboarded] = await Promise.all([
          AsyncStorage.getItem('mukurtham_user'),
          AsyncStorage.getItem('mukurtham_access_token'),
          AsyncStorage.getItem('mukurtham_onboarding_done'),
        ]);

        if (cancelled) return;

        if (!userJson || !token || !onboarded) {
          dispatch(clearAuth());
          return;
        }

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
          if (!cancelled) dispatch(clearAuth());
        }
      } catch {
        if (!cancelled) dispatch(clearAuth());
      }
    })();

    return () => { cancelled = true; };
  }, [dispatch]);
}
