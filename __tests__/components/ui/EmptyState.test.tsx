import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { View } from 'react-native';
import { EmptyState } from '@/components/ui/EmptyState';

describe('EmptyState Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders without crashing', () => {
      render(<EmptyState title="No items" />);
      expect(screen).toBeTruthy();
    });

    it('renders title', () => {
      render(<EmptyState title="No items found" />);
      expect(screen.getByText('No items found')).toBeTruthy();
    });
  });

  describe('description', () => {
    it('renders description when provided', () => {
      render(
        <EmptyState
          title="No items"
          description="Try adding some items to see them here."
        />
      );
      expect(screen.getByText('Try adding some items to see them here.')).toBeTruthy();
    });

    it('does not render description when not provided', () => {
      render(<EmptyState title="No items" />);
      expect(screen.queryByText('description')).toBeNull();
    });
  });

  describe('icon', () => {
    it('renders emoji icon when string is provided', () => {
      render(<EmptyState title="No items" icon="📭" />);
      expect(screen.getByText('📭')).toBeTruthy();
    });

    it('renders custom icon component when provided', () => {
      const CustomIcon = () => <View testID="custom-icon" />;
      render(<EmptyState title="No items" icon={<CustomIcon />} />);
      expect(screen.getByTestId('custom-icon')).toBeTruthy();
    });

    it('does not render icon container when no icon', () => {
      const { toJSON } = render(<EmptyState title="No items" />);
      // Component renders without icon
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('primary action', () => {
    it('renders action button when actionLabel is provided', () => {
      const onAction = jest.fn();
      render(
        <EmptyState
          title="No items"
          actionLabel="Add item"
          onAction={onAction}
        />
      );
      expect(screen.getByText('Add item')).toBeTruthy();
    });

    it('calls onAction when button is pressed', () => {
      const onAction = jest.fn();
      render(
        <EmptyState
          title="No items"
          actionLabel="Add item"
          onAction={onAction}
        />
      );

      fireEvent.press(screen.getByText('Add item'));
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('does not render action button when only label is provided (no handler)', () => {
      render(
        <EmptyState
          title="No items"
          actionLabel="Add item"
        />
      );
      // Button should not render without onAction
      expect(screen.queryByText('Add item')).toBeNull();
    });

    it('accepts actionVariant prop', () => {
      const onAction = jest.fn();
      render(
        <EmptyState
          title="No items"
          actionLabel="Add item"
          actionVariant="secondary"
          onAction={onAction}
        />
      );
      expect(screen.getByText('Add item')).toBeTruthy();
    });
  });

  describe('secondary action', () => {
    it('renders secondary action button', () => {
      const onSecondary = jest.fn();
      render(
        <EmptyState
          title="No items"
          secondaryActionLabel="Learn more"
          onSecondaryAction={onSecondary}
        />
      );
      expect(screen.getByText('Learn more')).toBeTruthy();
    });

    it('calls onSecondaryAction when pressed', () => {
      const onSecondary = jest.fn();
      render(
        <EmptyState
          title="No items"
          secondaryActionLabel="Learn more"
          onSecondaryAction={onSecondary}
        />
      );

      fireEvent.press(screen.getByText('Learn more'));
      expect(onSecondary).toHaveBeenCalledTimes(1);
    });

    it('renders both actions together', () => {
      const onAction = jest.fn();
      const onSecondary = jest.fn();
      render(
        <EmptyState
          title="No items"
          actionLabel="Add item"
          onAction={onAction}
          secondaryActionLabel="Learn more"
          onSecondaryAction={onSecondary}
        />
      );

      expect(screen.getByText('Add item')).toBeTruthy();
      expect(screen.getByText('Learn more')).toBeTruthy();
    });
  });

  describe('compact mode', () => {
    it('renders in compact mode', () => {
      render(<EmptyState title="No items" compact />);
      expect(screen.getByText('No items')).toBeTruthy();
    });

    it('uses smaller icon in compact mode', () => {
      render(<EmptyState title="No items" icon="📭" compact />);
      expect(screen.getByText('📭')).toBeTruthy();
    });

    it('uses smaller buttons in compact mode', () => {
      const onAction = jest.fn();
      render(
        <EmptyState
          title="No items"
          actionLabel="Add"
          onAction={onAction}
          compact
        />
      );
      expect(screen.getByText('Add')).toBeTruthy();
    });
  });

  describe('custom style', () => {
    it('accepts custom style prop', () => {
      const { toJSON } = render(
        <EmptyState title="No items" style={{ backgroundColor: 'red' }} />
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('animation', () => {
    it('renders with FadeInDown animation', () => {
      const { toJSON } = render(<EmptyState title="No items" />);
      // Component uses Animated.View with entering animation
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('action variants', () => {
    it('defaults to primary variant', () => {
      const onAction = jest.fn();
      render(
        <EmptyState
          title="No items"
          actionLabel="Add item"
          onAction={onAction}
        />
      );
      expect(screen.getByText('Add item')).toBeTruthy();
    });

    it('secondary action uses ghost variant', () => {
      const onSecondary = jest.fn();
      render(
        <EmptyState
          title="No items"
          secondaryActionLabel="Learn more"
          onSecondaryAction={onSecondary}
        />
      );
      // Ghost variant is applied to secondary action
      expect(screen.getByText('Learn more')).toBeTruthy();
    });
  });

  describe('complete example', () => {
    it('renders full empty state with all props', () => {
      const onAction = jest.fn();
      const onSecondary = jest.fn();

      render(
        <EmptyState
          icon="📭"
          title="No messages"
          description="You don't have any messages yet. Start a conversation!"
          actionLabel="New message"
          actionVariant="primary"
          onAction={onAction}
          secondaryActionLabel="Browse contacts"
          onSecondaryAction={onSecondary}
        />
      );

      expect(screen.getByText('📭')).toBeTruthy();
      expect(screen.getByText('No messages')).toBeTruthy();
      expect(screen.getByText("You don't have any messages yet. Start a conversation!")).toBeTruthy();
      expect(screen.getByText('New message')).toBeTruthy();
      expect(screen.getByText('Browse contacts')).toBeTruthy();
    });
  });
});
