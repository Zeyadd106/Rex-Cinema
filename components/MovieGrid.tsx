'use client';
import { motion, useReducedMotion } from 'framer-motion';
import type { Movie } from '@/types/movie';
import { cn } from '@/lib/utils';
import MovieCard from './MovieCard';

interface MovieGridProps {
  movies: Movie[];
  showStatus?: boolean;
  className?: string;
}

export default function MovieGrid({ movies, showStatus = false, className }: MovieGridProps) {
  const reduce = useReducedMotion();

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 xl:grid-cols-5',
        className,
      )}
    >
      {movies.map((movie, i) => (
        <motion.div
          key={movie.id}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.32), ease: [0.22, 1, 0.36, 1] }}
        >
          <MovieCard movie={movie} showStatus={showStatus} />
        </motion.div>
      ))}
    </div>
  );
}
