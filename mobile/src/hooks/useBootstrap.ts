import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '@/api/auth';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setAuthenticated, clearAuth } from '@/store/authSlice';
import { registerPushToken } from '@/services/pushNotifications';

export function useBootstrap() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);

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
            // Register push token after successful auth
            registerPushToken();
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
