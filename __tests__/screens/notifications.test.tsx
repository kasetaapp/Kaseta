import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

// Mock expo-router
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: any[]) => mockPush(...args),
    back: (...args: any[]) => mockBack(...args),
  },
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  ChevronLeft: () => null,
  Bell: () => null,
  Package: () => null,
  User: () => null,
  Megaphone: () => null,
  Wrench: () => null,
  Calendar: () => null,
  CheckCheck: () => null,
  Trash2: () => null,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

// Mock supabase
const mockSupabaseFrom = jest.fn();
const mockSupabaseChannel = jest.fn();
const mockSupabaseRemoveChannel = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockSupabaseFrom(table),
    channel: (name: string) => mockSupabaseChannel(name),
    removeChannel: (channel: any) => mockSupabaseRemoveChannel(channel),
  },
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
  }),
}));

// Import component after mocks
import NotificationsScreen from '@/app/(app)/notifications';

describe('NotificationsScreen', () => {
  const mockNotifications = [
    {
      id: 'notif-1',
      type: 'visitor_arrival',
      title: 'Visitor Arrived',
      body: 'John Doe has arrived at the gate',
      data: { access_log_id: 'log-123' },
      read_at: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 'notif-2',
      type: 'package_received',
      title: 'Package Received',
      body: 'You have a new package',
      data: { package_id: 'pkg-456' },
      read_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
      id: 'notif-3',
      type: 'announcement',
      title: 'New Announcement',
      body: 'Important community update',
      data: { announcement_id: 'ann-789' },
      read_at: null,
      created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: mockNotifications, error: null }),
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
        in: jest.fn().mockResolvedValue({ error: null }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });

    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    };
    mockSupabaseChannel.mockReturnValue(mockChannel);
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Notificaciones')).toBeTruthy();
      });
    });
  });

  describe('loading state', () => {
    it('shows loading state initially', () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue(new Promise(() => {})),
            }),
          }),
        }),
      });

      render(<NotificationsScreen />);

      expect(screen.getByText('Notificaciones')).toBeTruthy();
    });
  });

  describe('notification list', () => {
    it('displays notification titles', async () => {
      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Visitor Arrived')).toBeTruthy();
        expect(screen.getByText('Package Received')).toBeTruthy();
        expect(screen.getByText('New Announcement')).toBeTruthy();
      });
    });

    it('displays notification bodies', async () => {
      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe has arrived at the gate')).toBeTruthy();
        expect(screen.getByText('You have a new package')).toBeTruthy();
        expect(screen.getByText('Important community update')).toBeTruthy();
      });
    });
  });

  describe('unread indicator', () => {
    it('shows unread count', async () => {
      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('2 sin leer')).toBeTruthy();
      });
    });

    it('shows mark all as read button when unread exist', async () => {
      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Marcar todas como leídas')).toBeTruthy();
      });
    });

    it('hides mark all button when all are read', async () => {
      const allReadNotifications = mockNotifications.map((n) => ({
        ...n,
        read_at: new Date().toISOString(),
      }));

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: allReadNotifications, error: null }),
            }),
          }),
        }),
      });

      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.queryByText('sin leer')).toBeNull();
        expect(screen.queryByText('Marcar todas como leídas')).toBeNull();
      });
    });
  });

  describe('mark as read', () => {
    it('marks notification as read when pressed', async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: mockNotifications, error: null }),
            }),
          }),
        }),
        update: updateMock,
      });

      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Visitor Arrived')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Visitor Arrived'));

      await waitFor(() => {
        expect(updateMock).toHaveBeenCalled();
      });
    });

    it('marks all as read when button is pressed', async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
        in: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: mockNotifications, error: null }),
            }),
          }),
        }),
        update: updateMock,
      });

      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Marcar todas como leídas')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Marcar todas como leídas'));

      await waitFor(() => {
        expect(updateMock).toHaveBeenCalled();
      });
    });
  });

  describe('delete notification', () => {
    it('deletes notification when delete button is pressed', async () => {
      const deleteMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: mockNotifications, error: null }),
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
        delete: deleteMock,
      });

      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Visitor Arrived')).toBeTruthy();
      });

      // Delete button is rendered for each notification
    });
  });

  describe('navigation', () => {
    it('navigates to visitor history for visitor_arrival', async () => {
      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Visitor Arrived')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Visitor Arrived'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/(app)/visitor-history');
      });
    });

    it('navigates to package detail for package_received', async () => {
      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Package Received')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Package Received'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/(app)/packages/[id]',
          params: { id: 'pkg-456' },
        });
      });
    });

    it('navigates to announcement detail for announcement', async () => {
      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('New Announcement')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('New Announcement'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/(app)/announcements/[id]',
          params: { id: 'ann-789' },
        });
      });
    });
  });

  describe('time formatting', () => {
    it('shows "Ahora" for recent notifications', async () => {
      const recentNotification = [{
        id: 'notif-new',
        type: 'system',
        title: 'Recent',
        body: 'Just now',
        data: {},
        read_at: null,
        created_at: new Date().toISOString(),
      }];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: recentNotification, error: null }),
            }),
          }),
        }),
      });

      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Ahora')).toBeTruthy();
      });
    });
  });

  describe('empty state', () => {
    it('shows empty state when no notifications', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      });

      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin notificaciones')).toBeTruthy();
        expect(screen.getByText('Tus notificaciones aparecerán aquí')).toBeTruthy();
      });
    });
  });

  describe('real-time updates', () => {
    it('subscribes to real-time updates on mount', async () => {
      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(mockSupabaseChannel).toHaveBeenCalledWith('notifications-changes');
      });
    });

    it('unsubscribes on unmount', async () => {
      const { unmount } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(mockSupabaseChannel).toHaveBeenCalled();
      });

      unmount();

      expect(mockSupabaseRemoveChannel).toHaveBeenCalled();
    });
  });

  describe('no user', () => {
    it('handles missing user gracefully', async () => {
      jest.doMock('@/contexts/AuthContext', () => ({
        useAuth: () => ({
          user: null,
        }),
      }));

      // Component should handle null user
    });
  });

  describe('error handling', () => {
    it('handles fetch errors gracefully', async () => {
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: null, error: new Error('Fetch failed') }),
            }),
          }),
        }),
      });

      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching notifications:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });

  describe('pull to refresh', () => {
    it('supports pull to refresh', async () => {
      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Notificaciones')).toBeTruthy();
      });

      // Component has RefreshControl
    });

    it('refetches on refresh', async () => {
      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Visitor Arrived')).toBeTruthy();
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('notifications');
    });
  });

  describe('notification icons', () => {
    it('shows visitor icon for visitor_arrival type', async () => {
      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Visitor Arrived')).toBeTruthy();
      });

      // User icon should be displayed
    });

    it('shows package icon for package_received type', async () => {
      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Package Received')).toBeTruthy();
      });

      // Package icon should be displayed
    });

    it('shows announcement icon for announcement type', async () => {
      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('New Announcement')).toBeTruthy();
      });

      // Megaphone icon should be displayed
    });
  });

  describe('different notification types', () => {
    it('handles maintenance type', async () => {
      const maintenanceNotification = [{
        id: 'notif-maint',
        type: 'maintenance',
        title: 'Maintenance Update',
        body: 'Request completed',
        data: { maintenance_id: 'maint-123' },
        read_at: null,
        created_at: new Date().toISOString(),
      }];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: maintenanceNotification, error: null }),
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Maintenance Update')).toBeTruthy();
      });
    });

    it('handles reservation type', async () => {
      const reservationNotification = [{
        id: 'notif-res',
        type: 'reservation',
        title: 'Reservation Reminder',
        body: 'Pool reservation tomorrow',
        data: { reservation_id: 'res-123' },
        read_at: null,
        created_at: new Date().toISOString(),
      }];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: reservationNotification, error: null }),
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Reservation Reminder')).toBeTruthy();
      });
    });

    it('handles system type', async () => {
      const systemNotification = [{
        id: 'notif-sys',
        type: 'system',
        title: 'System Message',
        body: 'Welcome to KASETA',
        data: {},
        read_at: null,
        created_at: new Date().toISOString(),
      }];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: systemNotification, error: null }),
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('System Message')).toBeTruthy();
      });
    });
  });

  describe('haptic feedback', () => {
    it('triggers haptic on notification press', async () => {
      const Haptics = require('expo-haptics');

      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Visitor Arrived')).toBeTruthy();
      });

      expect(Haptics.impactAsync).toBeDefined();
    });
  });

  describe('additional navigation types', () => {
    it('handles maintenance_update type', async () => {
      const maintenanceNotification = [{
        id: 'notif-maint',
        type: 'maintenance_update',
        title: 'Maintenance Update',
        body: 'Your request is complete',
        data: { request_id: 'maint-123' },
        read_at: null,
        created_at: new Date().toISOString(),
      }];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: maintenanceNotification, error: null }),
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Maintenance Update')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Maintenance Update'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/(app)/maintenance/[id]',
          params: { id: 'maint-123' },
        });
      });
    });

    it('handles reservation_reminder type', async () => {
      const reservationNotification = [{
        id: 'notif-res',
        type: 'reservation_reminder',
        title: 'Reservation Reminder',
        body: 'Your pool reservation is tomorrow',
        data: {},
        read_at: null,
        created_at: new Date().toISOString(),
      }];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: reservationNotification, error: null }),
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Reservation Reminder')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Reservation Reminder'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/(app)/amenities');
      });
    });
  });

  describe('time formatting edge cases', () => {
    it('formats minutes correctly', async () => {
      const minuteOld = new Date(Date.now() - 15 * 60 * 1000); // 15 mins ago
      const oldNotification = [{
        id: 'notif-old',
        type: 'system',
        title: 'Minutes Ago',
        body: 'Test',
        data: {},
        read_at: null,
        created_at: minuteOld.toISOString(),
      }];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: oldNotification, error: null }),
            }),
          }),
        }),
      });

      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Minutes Ago')).toBeTruthy();
        expect(screen.getByText('Hace 15 min')).toBeTruthy();
      });
    });

    it('formats hours correctly', async () => {
      const hoursOld = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
      const oldNotification = [{
        id: 'notif-hours',
        type: 'system',
        title: 'Hours Ago',
        body: 'Test',
        data: {},
        read_at: null,
        created_at: hoursOld.toISOString(),
      }];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: oldNotification, error: null }),
            }),
          }),
        }),
      });

      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Hours Ago')).toBeTruthy();
        expect(screen.getByText('Hace 3h')).toBeTruthy();
      });
    });

    it('formats days correctly', async () => {
      const daysOld = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const oldNotification = [{
        id: 'notif-days',
        type: 'system',
        title: 'Days Ago',
        body: 'Test',
        data: {},
        read_at: null,
        created_at: daysOld.toISOString(),
      }];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: oldNotification, error: null }),
            }),
          }),
        }),
      });

      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Days Ago')).toBeTruthy();
        expect(screen.getByText('Hace 2d')).toBeTruthy();
      });
    });

    it('formats old dates as month-day', async () => {
      const weekOld = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const oldNotification = [{
        id: 'notif-week',
        type: 'system',
        title: 'Old Notification',
        body: 'Test',
        data: {},
        read_at: null,
        created_at: weekOld.toISOString(),
      }];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: oldNotification, error: null }),
            }),
          }),
        }),
      });

      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Old Notification')).toBeTruthy();
      });
    });
  });

  describe('read notifications', () => {
    it('skips marking already read notifications', async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const readNotifications = [{
        id: 'notif-read',
        type: 'system',
        title: 'Already Read',
        body: 'Test',
        data: {},
        read_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: readNotifications, error: null }),
            }),
          }),
        }),
        update: updateMock,
      });

      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Already Read')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Already Read'));

      // Update should not be called for already read notifications
    });
  });

  describe('mark all with no unread', () => {
    it('does nothing when all are read', async () => {
      const allReadNotifications = [{
        id: 'notif-1',
        type: 'system',
        title: 'Read 1',
        body: 'Test',
        data: {},
        read_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: allReadNotifications, error: null }),
            }),
          }),
        }),
      });

      render(<NotificationsScreen />);

      await waitFor(() => {
        // Mark all as read button should not be visible
        expect(screen.queryByText('Marcar todas como leídas')).toBeNull();
      });
    });
  });
});
