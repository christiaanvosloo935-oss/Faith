import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, eraseAll, exportAll, importAll, setSetting } from '../db';
import { isoDate } from '../lib/dates';
import { PageHeader, Segmented, VISIBILITY_INFO, useToast } from '../components/ui';
import { seedDemo } from '../lib/demo';

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
          This version has no server. Shared items travel inside a link you send yourself, and the contents sit after the “#” in the link, which browsers never send to any
          website.
        </p>
      </section>

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
