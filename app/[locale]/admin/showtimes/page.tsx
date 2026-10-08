'use client';
import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Modal from '@/components/admin/Modal';
import { EmptyState, ErrorState, LoadingState } from '@/components/admin/States';
import { SelectField, TextField, inputClass } from '@/components/admin/fields';
import { validationKey } from '@/components/admin/validation';
import { ApiError, api, apiErrorInfo } from '@/lib/client';
import { formatDay, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Movie } from '@/types/movie';
import type { Cinema, Hall, ShowtimeDetails } from '@/types/showtime';

interface Meta {
  cinemas: Cinema[];
  halls: Hall[];
  movies: Movie[];
}

interface FormState {
  movieId: string;
  cinemaId: string;
  hallId: string;
  date: string;
  time: string;
}

const EMPTY_FORM: FormState = { movieId: '', cinemaId: '', hallId: '', date: '', time: '' };

const TH = 'px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-white/45';
const ICON_BTN =
  'rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e31837]';
const FILTER_SELECT = cn(inputClass, 'h-12 rounded-full pe-8 sm:w-56 [&_option]:bg-[#0f0f0f]');
const DATE_CONTROL = cn(inputClass, 'h-12 rounded-full sm:w-52 [color-scheme:dark]');

export default function AdminShowtimesPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tValidation = useTranslations('validation');
  const locale = useLocale();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaFailed, setMetaFailed] = useState(false);
  const [showtimes, setShowtimes] = useState<ShowtimeDetails[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listFailed, setListFailed] = useState(false);
  const [cinemaId, setCinemaId] = useState('');
  const [movieId, setMovieId] = useState('');
  const [date, setDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ShowtimeDetails | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadMeta = useCallback(async () => {
    setMetaLoading(true);
    try {
      const [cinemasResponse, moviesResponse] = await Promise.all([
        api.get<{ cinemas: Cinema[]; halls: Hall[] }>('/cinemas'),
        api.get<{ movies: Movie[] }>('/movies'),
      ]);
      setMeta({ cinemas: cinemasResponse.cinemas, halls: cinemasResponse.halls, movies: moviesResponse.movies });
      setMetaFailed(false);
    } catch {
      setMetaFailed(true);
    } finally {
      setMetaLoading(false);
    }
  }, []);

  const loadShowtimes = useCallback(async () => {
    setListLoading(true);
    try {
      const params = new URLSearchParams();
      if (cinemaId) params.set('cinemaId', cinemaId);
      if (movieId) params.set('movieId', movieId);
      if (date) params.set('date', date);
      const query = params.toString();
      const response = await api.get<{ showtimes: ShowtimeDetails[] }>(
        `/showtimes${query ? `?${query}` : ''}`,
      );
      setShowtimes(response.showtimes);
      setListFailed(false);
    } catch {
      setListFailed(true);
    } finally {
      setListLoading(false);
    }
  }, [cinemaId, movieId, date]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    loadShowtimes();
  }, [loadShowtimes]);

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

  const openEdit = (showtime: ShowtimeDetails) => {
    setEditing(showtime);
    setForm({
      movieId: showtime.movieId,
      cinemaId: showtime.cinemaId,
      hallId: showtime.hallId,
      date: showtime.date,
      time: showtime.time,
    });
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
    const payload = { movieId: form.movieId, hallId: form.hallId, date: form.date, time: form.time };
    try {
      if (editing) await api.put<{ showtime: ShowtimeDetails }>(`/showtimes/${editing.id}`, payload);
      else await api.post<{ showtime: ShowtimeDetails }>('/showtimes', payload);
      close();
      await loadShowtimes();
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

  const remove = async (showtime: ShowtimeDetails) => {
    if (!window.confirm(t('form.deleteShowtime'))) return;
    try {
      await api.del(`/showtimes/${showtime.id}`);
      await loadShowtimes();
    } catch {
      setListFailed(true);
    }
  };

  if (metaLoading) return <LoadingState />;
  if (metaFailed || !meta) return <ErrorState onRetry={loadMeta} />;

  const hallOptions = meta.halls
    .filter((hall) => hall.cinemaId === form.cinemaId)
    .map((hall) => ({ value: hall.id, label: `${hall.name} · ${hall.format}` }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <select
          value={cinemaId}
          onChange={(event) => setCinemaId(event.target.value)}
          aria-label={t('table.cinema')}
          className={FILTER_SELECT}
        >
          <option value="">{t('table.filterAll')}</option>
          {meta.cinemas.map((cinema) => (
            <option key={cinema.id} value={cinema.id}>
              {cinema.name}
            </option>
          ))}
        </select>
        <select
          value={movieId}
          onChange={(event) => setMovieId(event.target.value)}
          aria-label={t('table.movie')}
          className={FILTER_SELECT}
        >
          <option value="">{t('table.filterAll')}</option>
          {meta.movies.map((movie) => (
            <option key={movie.id} value={movie.id}>
              {movie.title}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          aria-label={t('table.date')}
          className={DATE_CONTROL}
        />
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-[#e31837] px-5 text-sm font-bold text-white transition hover:bg-[#c41530] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e31837] lg:w-auto lg:ms-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('form.addShowtime')}
        </button>
      </div>

      {listLoading ? (
        <LoadingState />
      ) : listFailed ? (
        <ErrorState onRetry={loadShowtimes} />
      ) : showtimes.length === 0 ? (
        <EmptyState message={t('empty.showtimes')} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0f0f0f]">
          <table className="w-full min-w-[920px]">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className={TH}>{t('table.movie')}</th>
                <th className={TH}>{t('table.date')}</th>
                <th className={TH}>{t('table.time')}</th>
                <th className={TH}>{t('table.cinema')}</th>
                <th className={TH}>{t('table.hall')}</th>
                <th className={cn(TH, 'text-end')}>{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {showtimes.map((showtime) => (
                <tr key={showtime.id} className="transition hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-medium text-white">{showtime.movieTitle}</td>
                  <td className="px-4 py-3 text-white/65">{formatDay(showtime.date, locale)}</td>
                  <td className="px-4 py-3 text-white/65">{formatTime(showtime.time, locale)}</td>
                  <td className="px-4 py-3 text-white/60">
                    {showtime.cinemaName}
                    <span className="block text-xs text-white/40">{showtime.cinemaCity}</span>
                  </td>
                  <td className="px-4 py-3 text-white/60">
                    {showtime.hallName}
                    <span className="mt-1 block text-xs font-semibold text-white/45">{showtime.format}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(showtime)}
                        aria-label={`${tCommon('edit')} — ${showtime.movieTitle}`}
                        className={ICON_BTN}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(showtime)}
                        aria-label={`${tCommon('delete')} — ${showtime.movieTitle}`}
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
        title={editing ? t('form.editShowtime') : t('form.addShowtime')}
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
          <SelectField
            label={t('table.movie')}
            value={form.movieId}
            onChange={(value) => patch({ movieId: value })}
            options={meta.movies.map((movie) => ({ value: movie.id, label: movie.title }))}
            placeholder={t('form.selectMovie')}
            error={fieldError('movieId')}
            required
          />
          <SelectField
            label={t('table.cinema')}
            value={form.cinemaId}
            onChange={(value) => patch({ cinemaId: value, hallId: '' })}
            options={meta.cinemas.map((cinema) => ({ value: cinema.id, label: cinema.name }))}
            placeholder={t('form.selectCinema')}
          />
          <SelectField
            label={t('table.hall')}
            value={form.hallId}
            onChange={(value) => patch({ hallId: value })}
            options={hallOptions}
            placeholder={t('form.selectHall')}
            error={fieldError('hallId')}
            required
          />
          <TextField
            label={t('form.selectDate')}
            type="date"
            value={form.date}
            onChange={(value) => patch({ date: value })}
            error={fieldError('date')}
            required
          />
          <TextField
            label={t('form.selectTime')}
            type="time"
            value={form.time}
            onChange={(value) => patch({ time: value })}
            error={fieldError('time')}
            required
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
