import { useRef, useState } from 'react';
import type { ScheduleFile } from '../lib/schedule';
import { exportProgress, importProgress, resetProgress, setSchedule, setTheme, today, type ThemePref } from '../lib/store';
import { useHydrated, useStore } from '../lib/hooks';
import { Skeleton } from './steps';
import { Ic } from './icons';

const THEMES: { id: ThemePref; label: string }[] = [
  { id: 'system', label: 'Match my device' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

/** "2026-11-23T12:15:00+01:00" or a local value -> value for <input type="datetime-local"> */
function toLocalInput(at: string): string {
  const d = new Date(at);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function SettingsPanel({ schedule }: { schedule: ScheduleFile }) {
  const state = useStore();
  const hydrated = useHydrated();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  if (!hydrated) return <Skeleton lines={5} block />;

  const sched = state.settings.schedule;
  const applyTheme = (t: ThemePref) => {
    setTheme(t);
    const resolved = t === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t;
    document.documentElement.dataset.theme = resolved;
  };

  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kopi-academy-progress-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setNote({ ok: true, text: 'Progress file saved. Open this page on your other device and import it there.' });
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const res = importProgress(await f.text());
    setNote({ ok: res.ok, text: res.message });
    if (file.current) file.current.value = '';
  };

  return (
    <div className="settings">
      <section className="card settings__block" aria-labelledby="set-theme">
        <h2 id="set-theme">Look</h2>
        <fieldset className="seg">
          <legend>Colour theme</legend>
          {THEMES.map((t) => (
            <label className="seg__opt" key={t.id}>
              <input type="radio" name="theme" checked={state.settings.theme === t.id} onChange={() => applyTheme(t.id)} />
              <span>{t.label}</span>
            </label>
          ))}
        </fieldset>
        <p className="hint">Motion follows your device setting. If you ask your device to reduce motion, animations here turn into simple fades.</p>
      </section>

      <section className="card settings__block" aria-labelledby="set-sched">
        <h2 id="set-sched">Schedule</h2>
        <fieldset className="choices">
          <legend>Which dates should the Today card follow?</legend>
          <label className="choice">
            <input type="radio" name="mode" checked={sched.mode === 'default'} onChange={() => setSchedule({ mode: 'default' })} />
            <span>
              <strong>The published schedule</strong>
              <span className="hint">{schedule.label}. Once its exams are over, the site turns self-paced by itself.</span>
            </span>
          </label>
          <label className="choice">
            <input
              type="radio"
              name="mode"
              checked={sched.mode === 'custom'}
              onChange={() => setSchedule({ mode: 'custom', start: sched.start ?? today() })}
            />
            <span>
              <strong>My own start date</strong>
              <span className="hint">Keeps the same order of lessons, one per course per weekday, counted from the day you pick.</span>
            </span>
          </label>
          <label className="choice">
            <input type="radio" name="mode" checked={sched.mode === 'off'} onChange={() => setSchedule({ mode: 'off' })} />
            <span>
              <strong>Self-paced</strong>
              <span className="hint">No dates. The Today card just shows the next lesson on each path.</span>
            </span>
          </label>
        </fieldset>

        {sched.mode === 'custom' && (
          <div className="field">
            <label htmlFor="start">Start date</label>
            <input
              id="start"
              className="input"
              type="date"
              value={sched.start ?? ''}
              onChange={(e) => setSchedule({ start: e.target.value || undefined })}
            />
          </div>
        )}

        <div className="settings__exams">
          <h3>Exam dates</h3>
          <p className="hint">Used for the countdowns. Change them if your exam is at another time.</p>
          {schedule.exams.map((e) => {
            const value = sched.exams?.[e.id] ?? (sched.mode === 'default' ? toLocalInput(e.at) : '');
            return (
              <div className="field" key={e.id}>
                <label htmlFor={`exam-${e.id}`}>{e.title}</label>
                <input
                  id={`exam-${e.id}`}
                  className="input"
                  type="datetime-local"
                  value={value}
                  onChange={(ev) => {
                    const next = { ...(sched.exams ?? {}) };
                    if (ev.target.value) next[e.id] = ev.target.value;
                    else delete next[e.id];
                    setSchedule({ exams: next });
                  }}
                />
              </div>
            );
          })}
          {sched.exams && Object.keys(sched.exams).length > 0 && (
            <button type="button" className="btn btn--small" onClick={() => setSchedule({ exams: {} })}>
              <Ic.Redo /> Use the published exam dates
            </button>
          )}
        </div>
      </section>

      <section className="card settings__block" aria-labelledby="set-data">
        <h2 id="set-data">Your progress</h2>
        <p>
          Progress is stored in this browser only: {Object.values(state.lessons).filter((l) => l.done).length} finished
          lessons and {state.xp} XP. To carry on from another device, export a file here and import it there.
        </p>
        <div className="settings__row">
          <button type="button" className="btn" onClick={download}>
            <Ic.Download /> Export progress
          </button>
          <button type="button" className="btn" onClick={() => file.current?.click()}>
            <Ic.Upload /> Import progress
          </button>
          <input
            ref={file}
            className="vh"
            type="file"
            accept="application/json,.json"
            aria-label="Progress file to import"
            tabIndex={-1}
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>
        <p className={`note ${note ? (note.ok ? 'note--ok' : 'note--bad') : 'settings__note--empty'}`} role="status">
          {note && (
            <>
              {note.ok ? <Ic.Correct /> : <Ic.Wrong />}
              <span>{note.text}</span>
            </>
          )}
        </p>

        <div className="settings__danger">
          <h3>Start over</h3>
          {confirmReset ? (
            <div className="settings__row">
              <p>This clears every finished lesson, your XP and your streak on this device.</p>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  resetProgress();
                  setConfirmReset(false);
                  setNote({ ok: true, text: 'Progress cleared on this device.' });
                }}
              >
                <Ic.Trash /> Yes, clear my progress
              </button>
              <button type="button" className="btn btn--quiet" onClick={() => setConfirmReset(false)}>
                Keep it
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn--small" onClick={() => setConfirmReset(true)}>
              <Ic.Trash /> Clear progress on this device
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
