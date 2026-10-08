import Image from 'next/image';
import { cn } from '@/lib/utils';

interface PosterProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export default function Poster({ src, alt, className, sizes, priority }: PosterProps) {
  return (
    <div className={cn('relative overflow-hidden bg-[#141414]', className)}>
      <Image
        src={src || '/placeholder-movie.jpg'}
        alt={alt}
        fill
        sizes={sizes ?? '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'}
        priority={priority}
        className="object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
      />
    </div>
  );
}
