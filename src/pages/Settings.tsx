import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, eraseAll, exportAll, importAll, setSetting } from '../db';
import { isoDate } from '../lib/dates';
import { PageHeader, Segmented, VISIBILITY_INFO, useToast } from '../components/ui';
import { seedDemo } from '../lib/demo';
import { syncConfigured } from '../config';
import { NIV_NOTICE } from '../data/scripture';
import { useSyncStatus } from '../sync/engine';
import { allUpcoming, disablePush, downloadIcs, enablePush, isIos, isStandalone, pushEnabled, pushSupported, schedule, cancel, reminderFor, toCalEvent } from '../lib/reminders';

export default function Settings() {
  const toast = useToast();
  const file = useRef<HTMLInputElement>(null);
  const savedName = useLiveQuery(async () => ((await db.settings.get('name'))?.value as string) ?? '', []);
  const theme = useLiveQuery(async () => ((await db.settings.get('theme'))?.value as string) || 'auto', [], 'auto');
  const [name, setName] = useState('');
  useEffect(() => setName(savedName ?? ''), [savedName]);

  const backup = async () => {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `faith-backup-${isoDate()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Backup downloaded. Keep it somewhere safe.');
  };

  return (
    <div className="page">
      <PageHeader title="Settings" subtitle="Your data lives on this device." />

      <section className="card form">
        <label>
          Your name <span className="muted">(what your circle sees)</span>
          <div className="row-add">
            <input value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn" onClick={() => setSetting('name', name.trim()).then(() => toast('Saved'))}>
              Save
            </button>
          </div>
        </label>
        <div>
          <p className="label">Appearance</p>
          <Segmented
            value={theme as 'auto' | 'light' | 'dark'}
            onChange={(v) => setSetting('theme', v)}
            options={[
              { value: 'auto', label: 'Automatic' },
              { value: 'light', label: 'Daylight' },
              { value: 'dark', label: 'Evening' },
            ]}
          />
        </div>
      </section>

      <section className="card">
        <h2>Your privacy</h2>
        <ul className="privacy-list">
          {(['private', 'circle', 'community'] as const).map((v) => {
            const { label, hint, Icon } = VISIBILITY_INFO[v];
            return (
              <li key={v} className={`vis-${v}`}>
                <Icon size={18} />
                <div>
                  <strong>{label}</strong>
                  <p className="muted small">{hint}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="muted small">
          Private items never leave this phone. Live circles and pacts are end-to-end encrypted before they’re uploaded, so the server can’t read them. Items you share by
          link travel after the “#” in the link, which browsers never send to any website.
        </p>
      </section>

      <Reminders />

      {syncConfigured() && <SyncInfo />}

      <section className="card form">
        <h2>Backup</h2>
        <p className="muted">If you lose or replace your phone, a backup is the only way to get your prayers back.</p>
        <div className="actions wrap">
          <button className="btn primary" onClick={backup}>
            Download backup
          </button>
          <button className="btn" onClick={() => file.current?.click()}>
            Restore from backup
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              if (!confirm('Restoring replaces everything currently in the app. Continue?')) return;
              try {
                await importAll(JSON.parse(await f.text()));
                toast('Backup restored');
              } catch (err) {
                toast((err as Error).message);
              }
            }}
          />
        </div>
      </section>

      <section className="card">
        <h2>About</h2>
        <p className="muted small">{NIV_NOTICE}</p>
      </section>

      <section className="card form">
        <h2>Try it out</h2>
        <p className="muted">Fill the app with sample prayers, a circle, a pact and sermon notes to see how everything works.</p>
        <div className="actions wrap">
          <button className="btn" onClick={async () => (await seedDemo(), toast('Sample content added'))}>
            Add sample content
          </button>
          <button
            className="btn ghost danger"
            onClick={async () => {
              if (!confirm('Erase everything on this device? Download a backup first if you want to keep anything.')) return;
              await eraseAll();
              toast('Everything erased');
            }}
          >
            Erase all data
          </button>
        </div>
      </section>
    </div>
  );
}

function SyncInfo() {
  const { status, error } = useSyncStatus();
  const text = {
    off: 'No live circles or pacts yet. Use “Go live & invite” in the Circle tab.',
    connecting: 'Connecting…',
    live: 'Connected. Circle and pact updates arrive instantly.',
    offline: 'You’re offline. Changes are saved and will sync when you reconnect.',
    error: error || 'Sync is paused. It will retry automatically.',
  }[status];
  return (
    <section className="card">
      <h2>Live sync</h2>
      <p className="muted">{text}</p>
      <p className="muted small">
        Shared circles and pacts are end-to-end encrypted on your phone before upload. The server only stores scrambled data and can’t read it. Private prayers, your Walk
        and your notes are never uploaded.
      </p>
    </section>
  );
}

function Reminders() {
  const toast = useToast();
  const [push, setPush] = useState(false);
  const [busy, setBusy] = useState(false);
  const walk = useLiveQuery(async () => ((await db.settings.get('walkReminder'))?.value as string) ?? '', [], '');
  useEffect(() => {
    void pushEnabled().then(setPush);
  }, []);

  const togglePush = async () => {
    setBusy(true);
    try {
      if (push) {
        await disablePush();
        setPush(false);
        toast('Notifications turned off');
      } else {
        await enablePush();
        setPush(true);
        toast('Reminders are on');
      }
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const setWalk = async (value: string) => {
    await setSetting('walkReminder', value);
    if (!value) return void cancel('walk-daily');
    const [h, m] = value.split(':').map(Number);
    void schedule(reminderFor.walk(h, m));
  };

  return (
    <section className="card form">
      <h2>Reminders</h2>
      <p className="muted">For prayer look-backs, sermon follow-ups, your weekly check-in and, if you like, a daily step.</p>
      <label>
        Daily step reminder
        <select value={walk} onChange={(e) => setWalk(e.target.value)}>
          <option value="">Off</option>
          {['06:30', '07:00', '07:30', '08:00', '12:00', '17:00', '19:00', '20:00'].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <div>
        <p className="label">Phone notifications</p>
        {pushSupported() ? (
          <button className={`btn ${push ? '' : 'primary'}`} onClick={togglePush} disabled={busy}>
            {busy ? 'Just a moment…' : push ? 'Turn off notifications' : 'Turn on notifications'}
          </button>
        ) : (
          <p className="muted small">
            {isIos() && !isStandalone()
              ? 'On iPhone: tap Share → Add to Home Screen, open Faith from your Home Screen, then come back here to turn on notifications.'
              : 'Notifications aren’t available in this browser. Use the calendar option below instead.'}
          </p>
        )}
        <p className="muted small">Notifications say only things like “A prayer is ready to look back on”. Your prayer text never leaves your phone.</p>
      </div>

      <div>
        <p className="label">Or use your calendar</p>
        <button
          className="btn wrap-text"
          onClick={async () => {
            const list = await allUpcoming();
            if (!list.length) return toast('No upcoming reminders yet');
            downloadIcs('faith-reminders', list.map(toCalEvent));
          }}
        >
          Add all upcoming reminders to my calendar
        </button>
        <p className="muted small">Works on every phone. Open the downloaded file and choose “Add all”.</p>
      </div>
    </section>
  );
}
