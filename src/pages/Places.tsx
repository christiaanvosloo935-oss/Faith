import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Pin, type Visibility } from '../db';
import { BIBLICAL_SITES, ERAS, SURROUNDINGS, type BiblicalSite, type Era } from '../data/scripture';
import { currentPosition, distanceKm, formatDistance, nearest, type LatLng } from '../lib/geo';
import { sharePin, shareResultMessage } from '../lib/actions';
import { formatDate } from '../lib/dates';
import { Empty, PageHeader, Sheet, Verse, VisibilityBadge, VisibilityPicker, useMyName, useToast } from '../components/ui';
import { IconLocate, IconPlus, IconShare, IconTrash } from '../components/Icons';

const NEAR_PIN_KM = 0.3;

function dot(color: string, size = 14, ring = '#fff') {
  return L.divIcon({
    className: 'map-dot',
    html: `<span style="background:${color};width:${size}px;height:${size}px;border-color:${ring}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function Places() {
  const me = useMyName();
  const toast = useToast();
  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const [eras, setEras] = useState<Era[]>(['patriarchs', 'kingdom', 'jesus', 'church']);
  const [selected, setSelected] = useState<BiblicalSite>(BIBLICAL_SITES.find((s) => s.id === 'galilee')!);
  const [here, setHere] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [surrounding, setSurrounding] = useState<string | null>(null);
  const [pinning, setPinning] = useState(false);
  const pins = useLiveQuery(() => db.pins.orderBy('createdAt').reverse().toArray(), [], [] as Pin[]);

  const sites = useMemo(() => BIBLICAL_SITES.filter((s) => eras.includes(s.era)), [eras]);

  useEffect(() => {
    if (!mapEl.current || map.current) return;
    const m = L.map(mapEl.current, { zoomControl: true, scrollWheelZoom: false }).setView([33.5, 32], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    for (const era of eras) {
      const path = BIBLICAL_SITES.filter((s) => s.era === era).map((s) => [s.lat, s.lng] as [number, number]);
      if (era === 'church') L.polyline(path, { color: ERAS[era].color, weight: 2, dashArray: '4 6', opacity: 0.7 }).addTo(g);
    }
    for (const s of sites) {
      L.marker([s.lat, s.lng], { icon: dot(ERAS[s.era].color, s.id === selected.id ? 20 : 14), title: s.name })
        .on('click', () => setSelected(s))
        .addTo(g);
    }
    for (const p of pins) {
      L.marker([p.lat, p.lng], { icon: dot('#6f8f4e', 14, '#f3ead8'), title: `${p.reference} · ${p.placeName}` })
        .bindPopup(`<strong>${escapeHtml(p.reference)}</strong><br/>${escapeHtml(p.placeName)}`)
        .addTo(g);
    }
    if (here) L.marker([here.lat, here.lng], { icon: dot('#c0392b', 16), title: 'You are here' }).addTo(g);
  }, [sites, selected, pins, here, eras]);

  const locate = async () => {
    setLocating(true);
    try {
      const pos = await currentPosition();
      setHere(pos);
      map.current?.setView([pos.lat, pos.lng], 12);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setLocating(false);
    }
  };

  const closest = here ? nearest(here, BIBLICAL_SITES) : undefined;
  const nearbyPins = here ? pins.filter((p) => distanceKm(here, p) <= NEAR_PIN_KM) : [];
  const verseHere = SURROUNDINGS.find((s) => s.id === surrounding);

  return (
    <div className="page">
      <PageHeader title="Places" subtitle="Scripture where it happened, and Scripture where you are." />

      <div className="era-filter">
        {(Object.keys(ERAS) as Era[]).map((e) => (
          <button key={e} className={`chip ${eras.includes(e) ? 'on' : ''}`} onClick={() => setEras(eras.includes(e) ? eras.filter((x) => x !== e) : [...eras, e])}>
            <span className="swatch" style={{ background: ERAS[e].color }} /> {ERAS[e].label}
          </button>
        ))}
      </div>

      <div className="map-wrap card flat">
        <div ref={mapEl} className="map" />
      </div>

      <article className="card site-card">
        <p className="eyebrow" style={{ color: ERAS[selected.era].color }}>
          {ERAS[selected.era].label}
        </p>
        <h2>{selected.name}</h2>
        <p className="muted">{selected.story}</p>
        <Verse reference={selected.reference} text={selected.text} />
        {here && <p className="meta">You are {formatDistance(distanceKm(here, selected))} from here.</p>}
        <div className="site-strip">
          {sites.map((s) => (
            <button
              key={s.id}
              className={`chip ${s.id === selected.id ? 'on' : ''}`}
              onClick={() => {
                setSelected(s);
                map.current?.setView([s.lat, s.lng], 7);
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      </article>

      <section className="card">
        <h2>Where are you right now?</h2>
        <div className="actions wrap">
          <button className="btn" onClick={locate} disabled={locating}>
            <IconLocate size={18} /> {locating ? 'Finding you…' : here ? 'Update my location' : 'Use my location'}
          </button>
          <button className="btn primary" onClick={() => (here ? setPinning(true) : locate().then(() => setPinning(true)))}>
            <IconPlus size={18} /> Pin a verse here
          </button>
        </div>
        {closest && (
          <p className="meta">
            The nearest place on the map is <strong>{closest.item.name}</strong>, {formatDistance(closest.km)} away.
          </p>
        )}
        {nearbyPins.length > 0 && (
          <div className="callout">
            <p className="eyebrow">You’ve been here before</p>
            {nearbyPins.map((p) => (
              <Verse key={p.id} compact reference={p.reference} text={p.note ? `${p.text} (${p.note})` : p.text} />
            ))}
          </div>
        )}
        <p className="muted small">Choose what’s around you:</p>
        <div className="surroundings">
          {SURROUNDINGS.map((s) => (
            <button key={s.id} className={`chip ${surrounding === s.id ? 'on' : ''}`} onClick={() => setSurrounding(surrounding === s.id ? null : s.id)}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
        {verseHere && <Verse reference={verseHere.reference} text={verseHere.text} />}
      </section>

      <section>
        <h2 className="section-title">Your pinned verses</h2>
        {pins.length ? (
          <div className="stack">
            {pins.map((p) => (
              <article key={p.id} className="card">
                <div className="card-top">
                  <span className="meta">
                    {p.placeName} · {formatDate(p.createdAt)}
                  </span>
                  <VisibilityBadge value={p.visibility} />
                </div>
                <Verse compact reference={p.reference} text={p.text} />
                {p.note && <p className="answer-note">{p.note}</p>}
                <div className="actions">
                  <button className="btn ghost small" onClick={() => map.current?.setView([p.lat, p.lng], 15)}>
                    Show on map
                  </button>
                  {p.visibility !== 'private' && (
                    <button className="btn ghost small" onClick={async () => toast(shareResultMessage(await sharePin(p, me)))}>
                      <IconShare size={15} /> Share
                    </button>
                  )}
                  <button className="btn ghost small danger" onClick={() => confirm('Remove this pin?') && db.pins.delete(p.id!)} aria-label="Delete pin">
                    <IconTrash size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty title="No pins yet">Pin a verse to a place that matters, like the bench where you pray or the hospital where you waited. When you come back, the app reminds you.</Empty>
        )}
      </section>

      <Sheet open={pinning && !!here} title="Pin a verse to this place" onClose={() => setPinning(false)}>
        {here && <PinForm here={here} suggestion={verseHere} onDone={() => setPinning(false)} />}
      </Sheet>
    </div>
  );
}

function PinForm({ here, suggestion, onDone }: { here: LatLng; suggestion?: { reference: string; text: string }; onDone: () => void }) {
  const toast = useToast();
  const [placeName, setPlaceName] = useState('');
  const [reference, setReference] = useState(suggestion?.reference ?? '');
  const [text, setText] = useState(suggestion?.text ?? '');
  const [note, setNote] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!reference.trim()) return;
        await db.pins.add({ ...here, placeName: placeName.trim() || 'A special place', reference: reference.trim(), text: text.trim(), note: note.trim(), createdAt: Date.now(), visibility });
        toast('Verse pinned to this place');
        onDone();
      }}
    >
      <label>
        Name this place
        <input value={placeName} onChange={(e) => setPlaceName(e.target.value)} placeholder="e.g. The bench by the river" autoFocus />
      </label>
      <label>
        Verse reference
        <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. Psalm 23:2" required />
      </label>
      <label>
        Verse text
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <label>
        Why this place matters <span className="muted">(optional)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <VisibilityPicker value={visibility} onChange={setVisibility} options={['private', 'community']} />
      <button className="btn primary block">Pin verse</button>
    </form>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
