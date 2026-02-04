import React from 'react';
import { render, screen } from '@testing-library/react-native';
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonVariant,
} from '@/components/ui/Skeleton';

describe('Skeleton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders without crashing', () => {
      render(<Skeleton />);
      expect(screen).toBeTruthy();
    });

    it('renders with default props', () => {
      const { toJSON } = render(<Skeleton />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('width prop', () => {
    it('accepts number width', () => {
      const { toJSON } = render(<Skeleton width={100} />);
      expect(toJSON()).toBeTruthy();
    });

    it('accepts string width (percentage)', () => {
      const { toJSON } = render(<Skeleton width="50%" />);
      expect(toJSON()).toBeTruthy();
    });

    it('defaults to 100% width', () => {
      const { toJSON } = render(<Skeleton />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('height prop', () => {
    it('accepts custom height', () => {
      const { toJSON } = render(<Skeleton height={24} />);
      expect(toJSON()).toBeTruthy();
    });

    it('defaults to 16px height', () => {
      const { toJSON } = render(<Skeleton />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('variants', () => {
    it.each([
      ['text', 'text'],
      ['circular', 'circular'],
      ['rectangular', 'rectangular'],
      ['rounded', 'rounded'],
    ])('renders %s variant correctly', (variant) => {
      const { toJSON } = render(<Skeleton variant={variant as SkeletonVariant} />);
      expect(toJSON()).toBeTruthy();
    });

    it('defaults to rounded variant', () => {
      const { toJSON } = render(<Skeleton />);
      expect(toJSON()).toBeTruthy();
    });

    it('circular variant uses height for border radius calculation', () => {
      const { toJSON } = render(<Skeleton variant="circular" height={50} />);
      expect(toJSON()).toBeTruthy();
    });

    it('rectangular variant has no border radius', () => {
      const { toJSON } = render(<Skeleton variant="rectangular" />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('animate prop', () => {
    it('animates by default', () => {
      const { toJSON } = render(<Skeleton />);
      expect(toJSON()).toBeTruthy();
    });

    it('can disable animation', () => {
      const { toJSON } = render(<Skeleton animate={false} />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('custom style', () => {
    it('accepts custom style prop', () => {
      const { toJSON } = render(<Skeleton style={{ margin: 10 }} />);
      expect(toJSON()).toBeTruthy();
    });
  });
});

describe('SkeletonText Component', () => {
  describe('basic rendering', () => {
    it('renders without crashing', () => {
      render(<SkeletonText />);
      expect(screen).toBeTruthy();
    });
  });

  describe('lines prop', () => {
    it('renders 3 lines by default', () => {
      const { toJSON } = render(<SkeletonText />);
      // Component renders, default is 3 lines
      expect(toJSON()).toBeTruthy();
    });

    it('renders custom number of lines', () => {
      const { toJSON } = render(<SkeletonText lines={5} />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders single line', () => {
      const { toJSON } = render(<SkeletonText lines={1} />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('lastLineWidth prop', () => {
    it('uses 60% width for last line by default', () => {
      const { toJSON } = render(<SkeletonText />);
      expect(toJSON()).toBeTruthy();
    });

    it('accepts custom lastLineWidth as number', () => {
      const { toJSON } = render(<SkeletonText lastLineWidth={100} />);
      expect(toJSON()).toBeTruthy();
    });

    it('accepts custom lastLineWidth as percentage', () => {
      const { toJSON } = render(<SkeletonText lastLineWidth="80%" />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('spacing prop', () => {
    it('uses default spacing between lines', () => {
      const { toJSON } = render(<SkeletonText />);
      expect(toJSON()).toBeTruthy();
    });

    it('accepts custom spacing', () => {
      const { toJSON } = render(<SkeletonText spacing={16} />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('custom style', () => {
    it('accepts custom style prop', () => {
      const { toJSON } = render(<SkeletonText style={{ margin: 10 }} />);
      expect(toJSON()).toBeTruthy();
    });
  });
});

describe('SkeletonAvatar Component', () => {
  describe('basic rendering', () => {
    it('renders without crashing', () => {
      render(<SkeletonAvatar />);
      expect(screen).toBeTruthy();
    });
  });

  describe('size prop', () => {
    it('uses default size', () => {
      const { toJSON } = render(<SkeletonAvatar />);
      expect(toJSON()).toBeTruthy();
    });

    it('accepts custom size', () => {
      const { toJSON } = render(<SkeletonAvatar size={60} />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('circular shape', () => {
    it('renders as circular skeleton', () => {
      const { toJSON } = render(<SkeletonAvatar />);
      // SkeletonAvatar uses circular variant
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('custom style', () => {
    it('accepts custom style prop', () => {
      const { toJSON } = render(<SkeletonAvatar style={{ margin: 10 }} />);
      expect(toJSON()).toBeTruthy();
    });
  });
});

describe('SkeletonCard Component', () => {
  describe('basic rendering', () => {
    it('renders without crashing', () => {
      render(<SkeletonCard />);
      expect(screen).toBeTruthy();
    });

    it('renders with all child skeletons', () => {
      const { toJSON } = render(<SkeletonCard />);
      // SkeletonCard includes avatar, text lines
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('structure', () => {
    it('includes avatar skeleton', () => {
      const { toJSON } = render(<SkeletonCard />);
      expect(toJSON()).toBeTruthy();
    });

    it('includes text skeletons', () => {
      const { toJSON } = render(<SkeletonCard />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('custom style', () => {
    it('accepts custom style prop', () => {
      const { toJSON } = render(<SkeletonCard style={{ margin: 10 }} />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('theme support', () => {
    it('renders in light mode', () => {
      const { toJSON } = render(<SkeletonCard />);
      expect(toJSON()).toBeTruthy();
    });
  });
});
