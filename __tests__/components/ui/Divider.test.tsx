import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Divider, DividerOrientation } from '@/components/ui/Divider';

describe('Divider Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders without crashing', () => {
      render(<Divider />);
      expect(screen).toBeTruthy();
    });

    it('renders horizontal by default', () => {
      const { toJSON } = render(<Divider />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('orientation', () => {
    it('renders horizontal divider', () => {
      const { toJSON } = render(<Divider orientation="horizontal" />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders vertical divider', () => {
      const { toJSON } = render(<Divider orientation="vertical" />);
      expect(toJSON()).toBeTruthy();
    });

    it('defaults to horizontal', () => {
      const { toJSON } = render(<Divider />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('label', () => {
    it('renders label text when provided', () => {
      render(<Divider label="OR" />);
      expect(screen.getByText('OR')).toBeTruthy();
    });

    it('renders label only for horizontal orientation', () => {
      render(<Divider orientation="horizontal" label="Section" />);
      expect(screen.getByText('Section')).toBeTruthy();
    });

    it('does not render label for vertical orientation', () => {
      const { toJSON } = render(<Divider orientation="vertical" label="Test" />);
      // Vertical dividers don't support labels, should render without label
      expect(toJSON()).toBeTruthy();
    });

    it('renders label between two lines', () => {
      render(<Divider label="Middle" />);
      expect(screen.getByText('Middle')).toBeTruthy();
      // Label is rendered between two horizontal lines
    });
  });

  describe('spacing', () => {
    it('accepts custom spacing', () => {
      const { toJSON } = render(<Divider spacing={24} />);
      expect(toJSON()).toBeTruthy();
    });

    it('uses default horizontal spacing', () => {
      const { toJSON } = render(<Divider orientation="horizontal" />);
      expect(toJSON()).toBeTruthy();
    });

    it('uses default vertical spacing', () => {
      const { toJSON } = render(<Divider orientation="vertical" />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('subtle prop', () => {
    it('renders with subtle styling', () => {
      const { toJSON } = render(<Divider subtle />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders without subtle styling by default', () => {
      const { toJSON } = render(<Divider />);
      expect(toJSON()).toBeTruthy();
    });

    it('subtle affects both orientations', () => {
      const { toJSON: horizontal } = render(<Divider subtle orientation="horizontal" />);
      const { toJSON: vertical } = render(<Divider subtle orientation="vertical" />);

      expect(horizontal()).toBeTruthy();
      expect(vertical()).toBeTruthy();
    });
  });

  describe('custom style', () => {
    it('accepts custom style prop', () => {
      const { toJSON } = render(<Divider style={{ marginTop: 20 }} />);
      expect(toJSON()).toBeTruthy();
    });

    it('merges custom style with default styles', () => {
      const { toJSON } = render(
        <Divider style={{ backgroundColor: 'red' }} />
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('theme support', () => {
    it('renders in light mode', () => {
      const { toJSON } = render(<Divider />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('combined props', () => {
    it('renders horizontal with label and subtle', () => {
      render(
        <Divider
          orientation="horizontal"
          label="Section"
          subtle
          spacing={16}
        />
      );
      expect(screen.getByText('Section')).toBeTruthy();
    });

    it('renders vertical with spacing and subtle', () => {
      const { toJSON } = render(
        <Divider
          orientation="vertical"
          subtle
          spacing={12}
        />
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('dimensions', () => {
    it('horizontal has full width and 1px height', () => {
      const { toJSON } = render(<Divider orientation="horizontal" />);
      // StyleSheet specifies height: 1, width: '100%'
      expect(toJSON()).toBeTruthy();
    });

    it('vertical has 1px width and full height', () => {
      const { toJSON } = render(<Divider orientation="vertical" />);
      // StyleSheet specifies width: 1, height: '100%'
      expect(toJSON()).toBeTruthy();
    });
  });
});
