import * as React from 'react';
import { createContext, useContext, useEffect, useState, useRef } from 'react';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: any | null;
}

const NotificationContext = createContext<NotificationContextType>({
  expoPushToken: null,
  notification: null,
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any | null>(null);
  const notificationListener = useRef<any>(undefined);
  const responseListener = useRef<any>(undefined);

  useEffect(() => {
    // Import and configure notifications dynamically
    const setupNotifications = async () => {
      try {
        const Notifications = await import('expo-notifications');
        const Device = await import('expo-device');
        const Constants = await import('expo-constants');
        const { Platform } = await import('react-native');

        // Configure notification handler
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        // Register for push notifications
        const token = await registerForPushNotificationsAsync(Notifications, Device, Constants, Platform);
        if (token) {
          setExpoPushToken(token);
        }

        // Listen for incoming notifications
        notificationListener.current = Notifications.addNotificationReceivedListener((notification: any) => {
          setNotification(notification);
        });

        // Listen for notification interactions
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
          console.log('Notification response:', response);
          const data = response.notification.request.content.data;
          if (data?.type === 'scan') {
            // Navigate to activity tab
          } else if (data?.type === 'alert') {
            // Navigate to dashboard
          }
        });
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ expoPushToken, notification }}>
      {children}
    </NotificationContext.Provider>
  );
}

async function registerForPushNotificationsAsync(
  Notifications: any,
  Device: any,
  Constants: any,
  Platform: any
): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    try {
      const projectId = Constants.default?.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.log('No EAS project ID found');
        return null;
      }

      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Push token:', token);
    } catch (error) {
      console.log('Error getting push token:', error);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
