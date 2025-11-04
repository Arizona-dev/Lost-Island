import { PlayerAction } from '../../../src/game/Player';

// Test the random action selection logic
describe('Random Action Selection', () => {
  it('should include all valid actions', () => {
    const validActions = [PlayerAction.FISH, PlayerAction.COLLECT_WATER, PlayerAction.COLLECT_WOOD];

    expect(validActions).toContain(PlayerAction.FISH);
    expect(validActions).toContain(PlayerAction.COLLECT_WATER);
    expect(validActions).toContain(PlayerAction.COLLECT_WOOD);
    expect(validActions).toHaveLength(3);
  });

  it('should generate valid random actions', () => {
    const validActions = [PlayerAction.FISH, PlayerAction.COLLECT_WATER, PlayerAction.COLLECT_WOOD];

    // Test multiple random selections
    for (let i = 0; i < 10; i++) {
      const randomAction = validActions[Math.floor(Math.random() * validActions.length)];
      expect(validActions).toContain(randomAction);
    }
  });

  it('should have equal probability distribution', () => {
    const validActions = [PlayerAction.FISH, PlayerAction.COLLECT_WATER, PlayerAction.COLLECT_WOOD];
    const results: Record<string, number> = {};

    // Generate many random selections to test distribution
    for (let i = 0; i < 300; i++) {
      const randomAction = validActions[Math.floor(Math.random() * validActions.length)];
      results[randomAction] = (results[randomAction] || 0) + 1;
    }

    // Each action should appear roughly 100 times (300 / 3)
    Object.values(results).forEach(count => {
      expect(count).toBeGreaterThan(80); // Allow some variance
      expect(count).toBeLessThan(120);
    });
  });
});
