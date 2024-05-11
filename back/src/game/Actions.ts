import { WreckageObject, allObjects } from "./Objects";

const FishLuck = [0, 1, 1, 2, 2, 3];
const WoodLuck = [true, true, true, true, true, false];

export const handleFishingAction = (): number => {
  return FishLuck[Math.floor(Math.random() * FishLuck.length)];
};

export const handleCollectWaterAction = (rainValue: number): number => {
  return rainValue;
};

const shuffleArray = (array: boolean[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

export const handleCollectWoodAction = (numberOfWood: number): boolean => {
  if (!numberOfWood) {
    return true;
  }

  shuffleArray(WoodLuck);
  for (let i = 0; i < numberOfWood; i++) {
    if (!WoodLuck[i]) {
      return false;
    }
  }
  return true;
};

export const handleSearchWreckageAction = (): WreckageObject => {
  return allObjects[Math.floor(Math.random() * allObjects.length)];
};
