export type Vehicle = {
  id: number;
  name: string;
  totalCost: number;
  route: string[];
};

export const vehicles: Vehicle[] = [
  {
    id: 1,
    name: "Araç-1",
    totalCost: 1250,
    route: ["İzmit", "Gebze", "Darıca"]
  },
  {
    id: 2,
    name: "Araç-2",
    totalCost: 980,
    route: ["Gölcük", "İzmit"]
  }
];
