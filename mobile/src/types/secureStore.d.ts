declare module 'react-native-secure-store' {
  export interface SecureStoreOptions {
    accessible?: string;
  }

  export const ACCESSIBLE: {
    WHEN_UNLOCKED: string;
    AFTER_FIRST_UNLOCK: string;
    ALWAYS: string;
    WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: string;
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: string;
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: string;
    ALWAYS_THIS_DEVICE_ONLY: string;
  };

  export function setItem(key: string, value: string, options?: SecureStoreOptions): Promise<void>;
  export function getItem(key: string): Promise<string>;
  export function deleteItem(key: string): Promise<void>;

  const SecureStore: {
    setItem: typeof setItem;
    getItem: typeof getItem;
    deleteItem: typeof deleteItem;
  };
  export default SecureStore;
}
