export interface User {
  username: string;
}

export interface Location {
  id: number;
  name: string;
  status: 'Safe' | 'Leaking';
  humidity: number;
  water_presence: number; // 0 or 1
  temperature: number;
}
