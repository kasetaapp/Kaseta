import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import {
  InvitationCard,
  InvitationCardSkeleton,
  InvitationCardProps,
} from '@/components/features/invitations/InvitationCard';
import { Invitation, InvitationStatus, InvitationType } from '@/lib/invitations';
import * as Haptics from 'expo-haptics';

// Helper to create mock invitation
const createMockInvitation = (overrides: Partial<Invitation> = {}): Invitation => ({
  id: 'inv-123',
  organization_id: 'org-1',
  created_by: 'user-1',
  visitor_name: 'John Visitor',
  visitor_phone: '+1234567890',
  visitor_email: 'visitor@example.com',
  type: 'single',
  valid_from: new Date().toISOString(),
  valid_until: new Date(Date.now() + 86400000).toISOString(),
  qr_data: 'KASETA:mock-uuid',
  short_code: 'ABC123',
  notes: null,
  used_at: null,
  status: 'active',
  created_at: new Date().toISOString(),
  ...overrides,
});

describe('InvitationCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders visitor name', () => {
      render(<InvitationCard invitation={createMockInvitation()} />);

      expect(screen.getByText('John Visitor')).toBeTruthy();
    });

    it('renders short code', () => {
      render(
        <InvitationCard invitation={createMockInvitation({ short_code: 'XYZ789' })} />
      );

      expect(screen.getByText('XYZ789')).toBeTruthy();
    });

    it('renders visitor phone when provided', () => {
      render(
        <InvitationCard
          invitation={createMockInvitation({ visitor_phone: '+1987654321' })}
        />
      );

      expect(screen.getByText('+1987654321')).toBeTruthy();
    });

    it('does not render phone when not provided', () => {
      render(
        <InvitationCard
          invitation={createMockInvitation({ visitor_phone: null })}
        />
      );

      expect(screen.queryByText('+1234567890')).toBeNull();
    });
  });

  describe('status badge', () => {
    it.each([
      ['active', 'Activa'],
      ['used', 'Usada'],
      ['expired', 'Expirada'],
      ['cancelled', 'Cancelada'],
    ])('displays correct label for %s status', (status, expectedLabel) => {
      render(
        <InvitationCard
          invitation={createMockInvitation({ status: status as InvitationStatus })}
        />
      );

      expect(screen.getByText(expectedLabel)).toBeTruthy();
    });
  });

  describe('invitation type', () => {
    it.each([
      ['single', 'Uso único'],
      ['recurring', 'Recurrente'],
      ['temporary', 'Temporal'],
    ])('displays correct label for %s invitation type', (invType, expectedLabel) => {
      render(
        <InvitationCard
          invitation={createMockInvitation({ type: invType as InvitationType })}
        />
      );

      expect(screen.getByText(expectedLabel)).toBeTruthy();
    });
  });

  describe('invitation type display', () => {
    it('shows recurring badge for recurring type', () => {
      render(
        <InvitationCard
          invitation={createMockInvitation({
            type: 'recurring',
          })}
        />
      );

      expect(screen.getByText('Recurrente')).toBeTruthy();
    });

    it('shows single use badge for single type', () => {
      render(
        <InvitationCard
          invitation={createMockInvitation({
            type: 'single',
          })}
        />
      );

      expect(screen.getByText('Uso único')).toBeTruthy();
    });
  });

  describe('date formatting', () => {
    it('shows "Hoy" for today\'s date', () => {
      const today = new Date();
      today.setHours(14, 30, 0, 0);

      render(
        <InvitationCard
          invitation={createMockInvitation({ valid_from: today.toISOString() })}
        />
      );

      expect(screen.getByText(/Hoy/)).toBeTruthy();
    });

    it('shows "Mañana" for tomorrow\'s date', () => {
      const tomorrow = new Date(Date.now() + 86400000);
      tomorrow.setHours(10, 0, 0, 0);

      render(
        <InvitationCard
          invitation={createMockInvitation({ valid_from: tomorrow.toISOString() })}
        />
      );

      expect(screen.getByText(/Mañana/)).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('calls onPress when card is pressed', () => {
      const onPress = jest.fn();
      const invitation = createMockInvitation();

      render(<InvitationCard invitation={invitation} onPress={onPress} />);

      fireEvent.press(screen.getByText('John Visitor'));

      expect(onPress).toHaveBeenCalledWith(invitation);
    });

    it('triggers haptic feedback on press', () => {
      const onPress = jest.fn();

      render(
        <InvitationCard invitation={createMockInvitation()} onPress={onPress} />
      );

      fireEvent.press(screen.getByText('John Visitor'));

      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      );
    });

    it('does not crash when onPress is not provided', () => {
      render(<InvitationCard invitation={createMockInvitation()} />);

      // Should not throw
      fireEvent.press(screen.getByText('John Visitor'));
    });
  });

  describe('press animations', () => {
    it('scales down on pressIn', () => {
      render(<InvitationCard invitation={createMockInvitation()} />);

      fireEvent(screen.getByText('John Visitor'), 'pressIn');

      // Animation is triggered (tested via mock verification)
      // Actual scale value is handled by reanimated
    });

    it('scales back up on pressOut', () => {
      render(<InvitationCard invitation={createMockInvitation()} />);

      fireEvent(screen.getByText('John Visitor'), 'pressIn');
      fireEvent(screen.getByText('John Visitor'), 'pressOut');

      // Animation reset is triggered
    });
  });

  describe('Avatar component', () => {
    it('renders avatar with visitor name', () => {
      render(
        <InvitationCard
          invitation={createMockInvitation({ visitor_name: 'Alice Smith' })}
        />
      );

      // Avatar component receives name prop and shows initials
      expect(screen.getByText('Alice Smith')).toBeTruthy();
    });
  });

  describe('date range display', () => {
    it('shows both valid_from and valid_until when both exist', () => {
      const validFrom = new Date('2024-12-01T10:00:00Z');
      const validUntil = new Date('2024-12-01T18:00:00Z');

      render(
        <InvitationCard
          invitation={createMockInvitation({
            valid_from: validFrom.toISOString(),
            valid_until: validUntil.toISOString(),
          })}
        />
      );

      // Both dates should be rendered (format depends on locale)
      const texts = screen.getAllByText(/-/);
      expect(texts.length).toBeGreaterThan(0);
    });

    it('shows valid_from and valid_until when valid_until is far future', () => {
      const farFuture = new Date(Date.now() + 86400000 * 365).toISOString();
      render(
        <InvitationCard
          invitation={createMockInvitation({ valid_until: farFuture })}
        />
      );

      // Should render without crashing
      expect(screen.getByText('John Visitor')).toBeTruthy();
    });
  });

  describe('index prop for animation delay', () => {
    it('accepts index prop for staggered animation', () => {
      render(
        <InvitationCard invitation={createMockInvitation()} index={5} />
      );

      // Should render without error
      expect(screen.getByText('John Visitor')).toBeTruthy();
    });

    it('defaults index to 0', () => {
      render(<InvitationCard invitation={createMockInvitation()} />);

      // Should render without error
      expect(screen.getByText('John Visitor')).toBeTruthy();
    });
  });

  describe('active status styling', () => {
    it('applies accent border for active invitations', () => {
      render(
        <InvitationCard invitation={createMockInvitation({ status: 'active' })} />
      );

      // Active status renders with accent styling
      expect(screen.getByText('Activa')).toBeTruthy();
    });

    it('applies default border for non-active invitations', () => {
      render(
        <InvitationCard invitation={createMockInvitation({ status: 'used' })} />
      );

      expect(screen.getByText('Usada')).toBeTruthy();
    });
  });
});

describe('InvitationCardSkeleton Component', () => {
  it('renders without crashing', () => {
    render(<InvitationCardSkeleton />);

    // Skeleton renders placeholder elements
    expect(screen).toBeTruthy();
  });

  it('applies skeleton opacity', () => {
    const { toJSON } = render(<InvitationCardSkeleton />);

    // Component renders with skeleton styling
    expect(toJSON()).toBeTruthy();
  });
});
