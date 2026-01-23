import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Input } from '@/components/ui/Input';
import * as Haptics from 'expo-haptics';

describe('Input Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('renders with label', () => {
    render(<Input label="Email" placeholder="Enter email" />);
    expect(screen.getByText('Email')).toBeTruthy();
  });

  it('handles text changes', () => {
    const onChangeText = jest.fn();
    render(<Input placeholder="Type here" onChangeText={onChangeText} />);

    const input = screen.getByPlaceholderText('Type here');
    fireEvent.changeText(input, 'Hello');
    expect(onChangeText).toHaveBeenCalledWith('Hello');
  });

  it('triggers haptic feedback on focus', () => {
    render(<Input placeholder="Focus me" />);

    const input = screen.getByPlaceholderText('Focus me');
    fireEvent(input, 'focus');
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('displays helper text', () => {
    render(<Input helperText="This is a hint" placeholder="Input" />);
    expect(screen.getByText('This is a hint')).toBeTruthy();
  });

  it('displays error message', () => {
    render(<Input error="This field is required" placeholder="Input" />);
    expect(screen.getByText('This field is required')).toBeTruthy();
  });

  it('error replaces helper text', () => {
    render(
      <Input
        helperText="This is a hint"
        error="This field is required"
        placeholder="Input"
      />
    );
    expect(screen.getByText('This field is required')).toBeTruthy();
    expect(screen.queryByText('This is a hint')).toBeNull();
  });

  it('is not editable when disabled', () => {
    render(<Input disabled placeholder="Disabled input" />);
    const input = screen.getByPlaceholderText('Disabled input');
    expect(input.props.editable).toBe(false);
  });

  it('renders left element', () => {
    const { getByTestId } = render(
      <Input
        placeholder="With icon"
        leftElement={<></>}
      />
    );
    expect(screen.getByPlaceholderText('With icon')).toBeTruthy();
  });

  it('renders right element', () => {
    render(
      <Input
        placeholder="With icon"
        rightElement={<></>}
      />
    );
    expect(screen.getByPlaceholderText('With icon')).toBeTruthy();
  });

  it('handles secure text entry', () => {
    render(<Input secureTextEntry placeholder="Password" />);
    const input = screen.getByPlaceholderText('Password');
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('passes through additional props', () => {
    render(
      <Input
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
    );
    const input = screen.getByPlaceholderText('Email');
    expect(input.props.keyboardType).toBe('email-address');
    expect(input.props.autoCapitalize).toBe('none');
  });
});
