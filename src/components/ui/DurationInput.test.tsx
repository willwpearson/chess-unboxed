import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DurationInput } from './DurationInput';

describe('DurationInput', () => {
  it('renders its label and initial value', () => {
    render(<DurationInput label="Increment" valueSec={5} onChangeSec={vi.fn()} min={0} max={60} />);
    expect(screen.getByText('Increment')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue(5);
  });

  it('fires onChangeSec with a valid in-range value', async () => {
    const onChangeSec = vi.fn();
    render(<DurationInput label="Increment" valueSec={0} onChangeSec={onChangeSec} min={0} max={60} />);
    const input = screen.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '30');
    expect(onChangeSec).toHaveBeenCalledWith(30);
  });

  it('does not fire onChangeSec for an out-of-range value', async () => {
    // Every prefix of "-1" is either NaN ("-") or below min ("-1"), so no
    // valid intermediate value is ever typed through on the way there —
    // unlike e.g. "999", whose "9" prefix is itself in range.
    const onChangeSec = vi.fn();
    render(<DurationInput label="Increment" valueSec={0} onChangeSec={onChangeSec} min={0} max={60} />);
    const input = screen.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '-1');
    expect(onChangeSec).not.toHaveBeenCalled();
  });

  it('shows an inline range error and reports invalidity for an out-of-range value', async () => {
    const onValidityChange = vi.fn();
    render(
      <DurationInput
        label="Increment"
        valueSec={0}
        onChangeSec={vi.fn()}
        min={0}
        max={60}
        onValidityChange={onValidityChange}
      />
    );
    const input = screen.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '999');
    expect(screen.getByText('Must be between 0 and 60')).toBeInTheDocument();
    expect(onValidityChange).toHaveBeenLastCalledWith(false);
  });

  it('resyncs the field to the last committed value on blur after invalid input', async () => {
    render(<DurationInput label="Increment" valueSec={10} onChangeSec={vi.fn()} min={0} max={60} />);
    const input = screen.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '999');
    await userEvent.tab();
    expect(input).toHaveValue(10);
  });

  it('renders an error message when provided', () => {
    render(
      <DurationInput label="Increment" valueSec={0} onChangeSec={vi.fn()} min={0} max={60} error="Too high" />
    );
    expect(screen.getByText('Too high')).toBeInTheDocument();
  });

  it('respects min, max, and step attributes', () => {
    render(<DurationInput label="Initial time" valueSec={300} onChangeSec={vi.fn()} min={15} max={10800} step={15} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('min', '15');
    expect(input).toHaveAttribute('max', '10800');
    expect(input).toHaveAttribute('step', '15');
  });
});
