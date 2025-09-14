import { useState, useEffect, useCallback } from 'react';

const REMINDER_ENABLED_KEY = 'waterTrackerReminderEnabled';
const LAST_NOTIFICATION_KEY = 'waterTrackerLastNotification';
const REMINDER_INTERVAL_HOURS = 1;

export const useNotificationReminder = (isGoalReached: boolean) => {
  const [isReminderEnabled, setIsReminderEnabled] = useState<boolean>(() => {
    return localStorage.getItem(REMINDER_ENABLED_KEY) === 'true';
  });
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() => {
    return 'Notification' in window ? Notification.permission : 'denied';
  });

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      alert('Browser ini tidak mendukung notifikasi desktop.');
      return 'denied';
    }
    
    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
    return permission;
  }, []);

  const toggleReminder = useCallback(async () => {
    let currentPermission = permissionStatus;
    if (currentPermission === 'default') {
      currentPermission = await requestPermission();
    }

    if (currentPermission === 'granted') {
      const nextState = !isReminderEnabled;
      setIsReminderEnabled(nextState);
      localStorage.setItem(REMINDER_ENABLED_KEY, String(nextState));
      if(nextState) {
         new Notification('Pengingat diaktifkan!', {
            body: 'Kami akan mengingatkan Anda untuk minum setiap jam.',
            icon: '/vite.svg',
          });
      }
    } else if (currentPermission === 'denied') {
        alert('Anda telah memblokir notifikasi. Harap aktifkan di pengaturan browser Anda untuk menggunakan fitur ini.');
    }
  }, [isReminderEnabled, permissionStatus, requestPermission]);

  useEffect(() => {
    if (!isReminderEnabled || permissionStatus !== 'granted' || isGoalReached) {
      return;
    }

    const intervalId = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      
      if (currentHour >= 8 && currentHour <= 21) {
        const lastNotificationTime = localStorage.getItem(LAST_NOTIFICATION_KEY);
        const lastTime = lastNotificationTime ? parseInt(lastNotificationTime, 10) : 0;
        const hoursSinceLast = (now.getTime() - lastTime) / (1000 * 60 * 60);

        if (hoursSinceLast >= REMINDER_INTERVAL_HOURS) {
          new Notification('Saatnya minum air 💧', {
            body: 'Tetap terhidrasi untuk menjaga kesehatan Anda.',
            icon: '/vite.svg',
            tag: 'water-reminder',
          });
          localStorage.setItem(LAST_NOTIFICATION_KEY, String(now.getTime()));
        }
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(intervalId);
  }, [isReminderEnabled, permissionStatus, isGoalReached]);

  return { isReminderEnabled, toggleReminder, permissionStatus };
};
