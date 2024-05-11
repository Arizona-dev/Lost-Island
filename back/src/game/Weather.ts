export type Weather = {
  id: string;
  description: string;
  water: number;
};

const WeatherCards: Weather[] = [
  { id: "1", description: "Sunny", water: 0 },
  { id: "2", description: "Sunny", water: 0 },
  { id: "3", description: "Sunny", water: 0 },
  { id: "4", description: "Sunny", water: 0 },
  { id: "5", description: "Rainy", water: 1 },
  { id: "6", description: "Rainy", water: 2 },
  { id: "7", description: "Rainy", water: 1 },
  { id: "8", description: "Rainy", water: 2 },
  { id: "9", description: "Stormy", water: 2 },
  { id: "10", description: "Stormy", water: 3 },
  { id: "11", description: "Stormy", water: 2 },
  { id: "12", description: "Stormy", water: 3 },
  { id: "13", description: "Sunny", water: 0 },
  { id: "14", description: "Rainy", water: 1 },
  { id: "15", description: "Stormy", water: 2 },
];

const hurricaneCard = { id: "16", description: "Hurricane", water: 3 };

export const shuffleWeatherList = () => {
  const shuffle = (array: Weather[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };

  shuffle(WeatherCards);
  const selectedCards = WeatherCards.slice(0, 6);
  selectedCards.push(hurricaneCard);
  shuffle(selectedCards);
  const restOfDeck = WeatherCards.slice(6);
  shuffle(restOfDeck);
  const finalDeck = restOfDeck.concat(selectedCards);

  return finalDeck;
};
