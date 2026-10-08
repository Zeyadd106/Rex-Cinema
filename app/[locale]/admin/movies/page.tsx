'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import SearchBar from '@/components/SearchBar';
import Modal from '@/components/admin/Modal';
import StatusPill, { statusTone } from '@/components/admin/StatusPill';
import { EmptyState, ErrorState, LoadingState } from '@/components/admin/States';
import { CheckboxField, SelectField, TextAreaField, TextField, inputClass } from '@/components/admin/fields';
import { validationKey } from '@/components/admin/validation';
import { ApiError, api, apiErrorInfo } from '@/lib/client';
import { cn } from '@/lib/utils';
import type { Movie, MovieInput, MovieStatus } from '@/types/movie';

interface FormState {
  title: string;
  description: string;
  poster: string;
  genre: string;
  duration: string;
  rating: string;
  language: string;
  director: string;
  cast: string;
  releaseDate: string;
  trailer: string;
  status: MovieStatus;
  featured: boolean;
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  poster: '',
  genre: '',
  duration: '',
  rating: '',
  language: '',
  director: '',
  cast: '',
  releaseDate: '',
  trailer: '',
  status: 'now-showing',
  featured: false,
};

type StatusFilter = 'all' | MovieStatus;

const TH = 'px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-white/45';
const ICON_BTN =
  'rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e31837]';
const TOOLBAR_SELECT = cn(
  inputClass,
  'h-12 rounded-full pe-8 sm:w-52 [&_option]:bg-[#0f0f0f]',
);

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toForm(movie: Movie): FormState {
  return {
    title: movie.title,
    description: movie.description,
    poster: movie.poster,
    genre: movie.genre.join(', '),
    duration: movie.duration,
    rating: movie.rating,
    language: movie.language,
    director: movie.director ?? '',
    cast: movie.cast.join(', '),
    releaseDate: movie.releaseDate,
    trailer: movie.trailerUrl ?? '',
    status: movie.status,
    featured: movie.featured,
  };
}

export default function AdminMoviesPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const tValidation = useTranslations('validation');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Movie | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<{ movies: Movie[] }>('/movies');
      setMovies(response.movies);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return movies.filter((movie) => {
      const matchesStatus = statusFilter === 'all' || movie.status === statusFilter;
      const matchesQuery =
        !needle ||
        movie.title.toLowerCase().includes(needle) ||
        movie.genre.join(' ').toLowerCase().includes(needle);
      return matchesStatus && matchesQuery;
    });
  }, [movies, q, statusFilter]);

  const patch = (changes: Partial<FormState>) => setForm((prev) => ({ ...prev, ...changes }));

  const fieldError = (name: string): string | undefined => {
    const codes = fieldErrors[name];
    return codes ? tValidation(validationKey(codes)) : undefined;
  };

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (movie: Movie) => {
    setEditing(movie);
    setForm(toForm(movie));
    setFieldErrors({});
    setFormError(null);
    setModalOpen(true);
  };

  const close = () => {
    setModalOpen(false);
    setFieldErrors({});
    setFormError(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFormError(null);
    const input: MovieInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      poster: form.poster.trim(),
      genre: splitList(form.genre),
      duration: form.duration.trim(),
      rating: form.rating.trim(),
      releaseDate: form.releaseDate,
      status: form.status,
      language: form.language.trim(),
      director: form.director.trim() || null,
      cast: splitList(form.cast),
      trailerUrl: form.trailer.trim() || null,
      featured: form.featured,
    };
    try {
      if (editing) await api.put<{ movie: Movie }>(`/movies/${editing.id}`, input);
      else await api.post<{ movie: Movie }>('/movies', input);
      close();
      await load();
    } catch (error) {
      const info = apiErrorInfo(error);
      setFieldErrors(info.fieldErrors);
      const hasFieldErrors = Object.keys(info.fieldErrors).length > 0;
      if (error instanceof ApiError && error.status === 422) {
        setFormError(hasFieldErrors ? null : tValidation('generic'));
      } else {
        setFormError(tValidation('unknown'));
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (movie: Movie) => {
    if (!window.confirm(t('form.deleteMovieConfirm'))) return;
    try {
      await api.del(`/movies/${movie.id}`);
      await load();
    } catch {
      setFailed(true);
    }
  };

  if (loading) return <LoadingState />;
  if (failed) return <ErrorState onRetry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={q} onChange={setQ} placeholder={t('table.search')} className="sm:flex-1" />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          aria-label={t('table.status')}
          className={TOOLBAR_SELECT}
        >
          <option value="all">{t('table.filterAll')}</option>
          <option value="now-showing">{tStatus('nowShowing')}</option>
          <option value="coming-soon">{tStatus('comingSoon')}</option>
        </select>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-[#e31837] px-5 text-sm font-bold text-white transition hover:bg-[#c41530] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e31837] sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('form.addMovie')}
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message={movies.length === 0 ? t('empty.movies') : tCommon('noResults')} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0f0f0f]">
          <table className="w-full min-w-[880px]">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className={TH}>{t('table.poster')}</th>
                <th className={TH}>{t('table.title')}</th>
                <th className={TH}>{t('table.genre')}</th>
                <th className={TH}>{t('table.duration')}</th>
                <th className={TH}>{t('table.rating')}</th>
                <th className={TH}>{t('table.status')}</th>
                <th className={cn(TH, 'text-end')}>{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((movie) => (
                <tr key={movie.id} className="transition hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <img
                      src={movie.poster || '/placeholder-movie.jpg'}
                      alt=""
                      width={40}
                      height={60}
                      loading="lazy"
                      className="h-[60px] w-10 rounded-md object-cover ring-1 ring-white/10"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{movie.title}</td>
                  <td className="px-4 py-3 text-white/60">
                    {movie.genre.join(', ') || tCommon('none')}
                  </td>
                  <td className="px-4 py-3 text-white/60">{movie.duration || tCommon('tba')}</td>
                  <td className="px-4 py-3 text-white/60">{movie.rating || tCommon('tba')}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={statusTone(movie.status)}>
                      {movie.status === 'now-showing' ? tStatus('nowShowing') : tStatus('comingSoon')}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(movie)}
                        aria-label={`${tCommon('edit')} — ${movie.title}`}
                        className={ICON_BTN}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(movie)}
                        aria-label={`${tCommon('delete')} — ${movie.title}`}
                        className={ICON_BTN}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={close}
        title={editing ? t('form.editMovie') : t('form.addMovie')}
      >
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          {formError ? (
            <p
              role="alert"
              className="rounded-xl border border-[#e31837]/40 bg-[#e31837]/10 px-3.5 py-2.5 text-xs font-medium text-[#ff6b81] sm:col-span-2"
            >
              {formError}
            </p>
          ) : null}
          <TextField
            label={t('table.title')}
            value={form.title}
            onChange={(value) => patch({ title: value })}
            error={fieldError('title')}
            required
          />
          <TextField
            label={t('table.releaseDate')}
            type="date"
            value={form.releaseDate}
            onChange={(value) => patch({ releaseDate: value })}
            error={fieldError('releaseDate')}
            required
          />
          <TextAreaField
            label={t('table.description')}
            value={form.description}
            onChange={(value) => patch({ description: value })}
            error={fieldError('description')}
            required
            className="sm:col-span-2"
          />
          <TextField
            label={t('table.poster')}
            type="url"
            value={form.poster}
            onChange={(value) => patch({ poster: value })}
            error={fieldError('poster')}
            className="sm:col-span-2"
          />
          <TextField
            label={t('table.genre')}
            value={form.genre}
            onChange={(value) => patch({ genre: value })}
            hint={t('form.genreHint')}
            error={fieldError('genre')}
          />
          <TextField
            label={t('table.duration')}
            value={form.duration}
            onChange={(value) => patch({ duration: value })}
            error={fieldError('duration')}
          />
          <TextField
            label={t('table.rating')}
            value={form.rating}
            onChange={(value) => patch({ rating: value })}
            error={fieldError('rating')}
          />
          <TextField
            label={t('table.language')}
            value={form.language}
            onChange={(value) => patch({ language: value })}
            error={fieldError('language')}
          />
          <TextField
            label={t('table.director')}
            value={form.director}
            onChange={(value) => patch({ director: value })}
            error={fieldError('director')}
          />
          <TextField
            label={t('table.cast')}
            value={form.cast}
            onChange={(value) => patch({ cast: value })}
            hint={t('form.castHint')}
            error={fieldError('cast')}
          />
          <TextField
            label={t('table.trailer')}
            type="url"
            value={form.trailer}
            onChange={(value) => patch({ trailer: value })}
            error={fieldError('trailer')}
            className="sm:col-span-2"
          />
          <SelectField
            label={t('table.status')}
            value={form.status}
            onChange={(value) => patch({ status: value as MovieStatus })}
            options={[
              { value: 'now-showing', label: tStatus('nowShowing') },
              { value: 'coming-soon', label: tStatus('comingSoon') },
            ]}
            error={fieldError('status')}
          />
          <CheckboxField
            label={t('table.featured')}
            hint={t('form.featuredHint')}
            checked={form.featured}
            onChange={(checked) => patch({ featured: checked })}
          />
          <div className="flex justify-end gap-2 border-t border-white/10 pt-4 sm:col-span-2">
            <button
              type="button"
              onClick={close}
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-white/70 ring-1 ring-white/15 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e31837]"
            >
              {tCommon('cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#e31837] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#c41530] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e31837]"
            >
              {saving ? tCommon('loading') : tCommon('save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
