type Resources = {
  food: number;
  water: number;
  wood: number;
  raftProgress: number;
};

type PlayerCount = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

const InitialResources: Record<PlayerCount, Resources> = {
  3: { food: 5, water: 6, wood: 0, raftProgress: 0 },
  4: { food: 7, water: 8, wood: 0, raftProgress: 0 },
  5: { food: 8, water: 10, wood: 0, raftProgress: 0 },
  6: { food: 10, water: 12, wood: 0, raftProgress: 0 },
  7: { food: 12, water: 14, wood: 0, raftProgress: 0 },
  8: { food: 13, water: 16, wood: 0, raftProgress: 0 },
  9: { food: 15, water: 18, wood: 0, raftProgress: 0 },
  10: { food: 16, water: 20, wood: 0, raftProgress: 0 },
  11: { food: 18, water: 22, wood: 0, raftProgress: 0 },
  12: { food: 20, water: 24, wood: 0, raftProgress: 0 },
};

export const getInitialResources = (playerCount: number): Resources => {
  if (playerCount in InitialResources) {
    return InitialResources[playerCount as PlayerCount];
  }
  return {
    food: 0,
    water: 0,
    wood: 0,
    raftProgress: 0,
  };
};
