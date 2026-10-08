export type MovieStatus = 'now-showing' | 'coming-soon';

export interface Movie {
  id: string;
  title: string;
  description: string;
  poster: string;
  genre: string[];
  duration: string;
  rating: string;
  releaseDate: string;
  status: MovieStatus;
  language: string;
  director: string | null;
  cast: string[];
  trailerUrl: string | null;
  featured: boolean;
}

export type MovieInput = Omit<Movie, 'id'>;

export interface MovieFilters {
  status?: MovieStatus;
  q?: string;
  genre?: string;
}
