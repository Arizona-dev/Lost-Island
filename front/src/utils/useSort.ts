import { useMemo, useState } from "react";

export const useSort = <T>(items: T[]) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: string;
  }>({
    key: "name",
    direction: "ascending",
  });

  const requestSort = (key: string) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedGames = useMemo(() => {
    const sortableGames = [...items];
    if (sortConfig !== null) {
      sortableGames.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableGames;
  }, [items, sortConfig]);

  return { items: sortedGames, requestSort, sortConfig };
};
