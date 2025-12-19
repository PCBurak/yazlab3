export type Station = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
};

export const stations: Station[] = [
  {
    id: 1,
    name: "İzmit",
    latitude: 40.765,
    longitude: 29.94,
  },
  {
    id: 2,
    name: "Gebze",
    latitude: 40.802,
    longitude: 29.43,
  },
  {
    id: 3,
    name: "Darıca",
    latitude: 40.772,
    longitude: 29.4,
  },
  {
    id: 4,
    name: "Gölcük",
    latitude: 40.712,
    longitude: 29.819,
  },
];
