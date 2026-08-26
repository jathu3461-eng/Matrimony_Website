import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSocket } from '@/context/SocketContext';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '@/api/client';

const { width: SCREEN_W } = Dimensions.get('window');
const TOAST_WIDTH = SCREEN_W - 32;
const PRIMARY = '#e0136a';

interface ToastMessage {
  id: string;
  senderName: string;
  senderPhoto?: string | null;
  text: string;
  profileA?: number | string;
  profileB?: number | string;
  threadKey?: string;
}

interface ToastContextValue {
  showToast: (msg: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

function MessageToast({
  msg,
  onDismiss,
  onPress,
  top,
}: {
  msg: ToastMessage;
  onDismiss: () => void;
  onPress: () => void;
  top: number;
}) {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 14,
        stiffness: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -120,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss());
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const photoUri = msg.senderPhoto
    ? msg.senderPhoto.startsWith('http')
      ? msg.senderPhoto
      : `${API_BASE_URL.replace(/\/api$/, '')}${msg.senderPhoto}`
    : null;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          top,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Pressable
        style={styles.toast}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>
                {msg.senderName?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.onlineDot} />
        </View>

        {/* Content */}
        <View style={styles.toastContent}>
          <Text style={styles.toastName} numberOfLines={1}>
            {msg.senderName}
          </Text>
          <Text style={styles.toastText} numberOfLines={1}>
            {msg.text}
          </Text>
        </View>

        {/* Close */}
        <Pressable onPress={onDismiss} hitSlop={8} style={styles.closeBtn}>
          <Ionicons name="close" size={16} color="#999" />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { subscribe } = useSocket();
  const currentUserIdRef = useRef<number | null>(null);

  // Get current user ID from store
  useEffect(() => {
    import('@/store').then(({ store }) => {
      const state = store.getState();
      currentUserIdRef.current = state.auth.user?.id ?? null;
    });
  }, []);

  const showToast = useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev.slice(-2), { ...msg, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handlePress = useCallback(
    (msg: ToastMessage) => {
      dismissToast(msg.id);
      if (msg.profileA && msg.profileB) {
        const profileA = Number(msg.profileA);
        const profileB = Number(msg.profileB);
        (navigation as any).navigate('ChatThread', {
          profileA,
          profileB,
          otherName: msg.senderName,
        });
      }
    },
    [navigation, dismissToast],
  );

  // Listen for incoming chat messages
  useEffect(() => {
    const unsub = subscribe('chat:message', (m: any) => {
      if (!m || m?.sender_user_id == null) return;
      if (String(m.sender_user_id) === String(currentUserIdRef.current)) return;

      showToast({
        senderName: m.sender_name || 'Someone',
        senderPhoto: m.sender_photo || null,
        text: m.message || m.text || m.content || '📷 Photo',
        profileA: m.sender_profile_id,
        profileB: m.receiver_profile_id,
        threadKey: m.thread_key,
      });
    });
    return unsub;
  }, [subscribe, showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((t, i) => (
        <MessageToast
          key={t.id}
          msg={t}
          top={insets.top + 12 + i * 80}
          onDismiss={() => dismissToast(t.id)}
          onPress={() => handlePress(t)}
        />
      ))}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 20,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(224,19,106,0.1)',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#fff',
  },
  toastContent: {
    flex: 1,
    marginRight: 8,
  },
  toastName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  toastText: {
    fontSize: 13,
    color: '#666',
  },
  closeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#f5f5f5',
  },
});
