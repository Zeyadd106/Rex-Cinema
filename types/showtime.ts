export type HallFormat = 'Standard' | 'IMAX' | 'MAX' | 'GOLD' | '4DX' | 'KIDS';

export interface Cinema {
  id: string;
  name: string;
  city: string;
  address: string;
}

export interface Hall {
  id: string;
  cinemaId: string;
  name: string;
  format: HallFormat;
  rows: string[];
  seatsPerRow: number;
}

export interface Showtime {
  id: string;
  movieId: string;
  hallId: string;
  date: string;
  time: string;
}

/** Showtime enriched with cinema/movie information for API responses. */
export interface ShowtimeDetails extends Showtime {
  movieTitle: string;
  moviePoster: string;
  hallName: string;
  format: HallFormat;
  cinemaId: string;
  cinemaName: string;
  cinemaCity: string;
}
