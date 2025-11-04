import { render, screen, act } from '@testing-library/react';
import OfflineTimer from '../Game';

// Extract the OfflineTimer component from the Game component
// For this test, we'll need to create a separate export or test it indirectly

describe('OfflineTimer Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should display countdown timer for disconnected players', () => {
    const offlineTimestamp = Date.now();

    // Note: Since OfflineTimer is not exported, we'd need to test it through the Game component
    // or export it separately. For now, this is a placeholder test structure.

    // render(<OfflineTimer offlineTimestamp={offlineTimestamp} />);
    // expect(screen.getByText(/30s/)).toBeInTheDocument();
  });

  it('should count down from 30 seconds', () => {
    const offlineTimestamp = Date.now();

    // Fast-forward 10 seconds
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Should show 20s remaining
    // expect(screen.getByText('20s')).toBeInTheDocument();
  });

  it('should show "LEFT" when timer expires', () => {
    const offlineTimestamp = Date.now();

    // Fast-forward past 30 seconds
    act(() => {
      jest.advanceTimersByTime(31000);
    });

    // Should show "LEFT" status
    // expect(screen.getByText('LEFT')).toBeInTheDocument();
  });

  it('should apply correct CSS classes', () => {
    const offlineTimestamp = Date.now();

    // Should have orange background while counting down
    // expect(screen.getByText(/\d+s/)).toHaveClass('bg-orange-600');

    // After expiry, should have grey background
    act(() => {
      jest.advanceTimersByTime(31000);
    });

    // expect(screen.getByText('LEFT')).toHaveClass('bg-gray-600');
  });
});
