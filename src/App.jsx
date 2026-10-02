import { useState } from 'react';
import {
  Plus, Check, Trash2, Search, CalendarDays,
  Briefcase, User, ShoppingBag, HeartPulse, LayoutList,
} from 'lucide-react';

const PRIORITIES = {
  low:    { label: 'ต่ำ',   badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', bar: 'bg-emerald-400', on: 'bg-emerald-500 text-white' },
  medium: { label: 'กลาง', badge: 'bg-amber-50 text-amber-700 ring-amber-200',       bar: 'bg-amber-400',   on: 'bg-amber-500 text-white' },
  high:   { label: 'สูง',   badge: 'bg-rose-50 text-rose-700 ring-rose-200',          bar: 'bg-rose-500',    on: 'bg-rose-500 text-white' },
};
const ORDER = ['low', 'medium', 'high'];

const CATS = {
  work:     { label: 'งาน',       Icon: Briefcase,   tag: 'bg-sky-50 text-sky-700 ring-sky-200',          on: 'bg-sky-500 text-white' },
  personal: { label: 'ส่วนตัว',   Icon: User,        tag: 'bg-violet-50 text-violet-700 ring-violet-200', on: 'bg-violet-500 text-white' },
  shopping: { label: 'ช้อปปิ้ง', Icon: ShoppingBag, tag: 'bg-pink-50 text-pink-700 ring-pink-200',       on: 'bg-pink-500 text-white' },
  health:   { label: 'สุขภาพ',   Icon: HeartPulse,  tag: 'bg-teal-50 text-teal-700 ring-teal-200',       on: 'bg-teal-500 text-white' },
};
const CAT_KEYS = Object.keys(CATS);

const FILTERS = [
  ['all', 'ทั้งหมด'],
  ['active', 'ยังไม่เสร็จ'],
  ['completed', 'เสร็จแล้ว'],
];

// ---------- date helpers (local time) ----------
const pad = (n) => String(n).padStart(2, '0');
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => toStr(new Date());
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return toStr(d); };
const fmtDate = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
};

function dueBadge(todo, today) {
  if (!todo.due) return null;
  const date = fmtDate(todo.due);
  if (todo.done) return { cls: 'bg-gray-100 text-gray-500 ring-gray-200', text: date };
  if (todo.due < today) return { cls: 'bg-red-100 text-red-700 ring-red-300', text: `เลยกำหนด · ${date}` };
  if (todo.due === today) return { cls: 'bg-yellow-100 text-yellow-800 ring-yellow-300', text: 'วันนี้' };
  return { cls: 'bg-gray-100 text-gray-600 ring-gray-200', text: date };
}

// ---------- donut chart ----------
function Donut({ segments, percent }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  let acc = 0;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 42 42" className="h-full w-full" role="img" aria-label={`เสร็จแล้ว ${percent}%`}>
        <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#e5e7eb" strokeWidth="5" />
        {total > 0 &&
          segments.map((s) => {
            const len = (s.value / total) * 100;
            const el = s.value > 0 && (
              <circle
                key={s.label}
                cx="21" cy="21" r="15.9155" fill="none"
                stroke={s.color} strokeWidth="5"
                strokeDasharray={`${len} ${100 - len}`}
                strokeDashoffset={25 - acc}
              />
            );
            acc += len;
            return el;
          })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-800">{percent}%</div>
    </div>
  );
}

let nextId = 5;

export default function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'ส่งรายงานให้อาจารย์', done: false, priority: 'high', due: addDays(-2), category: 'work' },
    { id: 2, text: 'ประชุมทีมโปรเจกต์', done: false, priority: 'medium', due: addDays(0), category: 'work' },
    { id: 3, text: 'ซื้อของเข้าบ้าน', done: false, priority: 'low', due: addDays(3), category: 'shopping' },
    { id: 4, text: 'วิ่งออกกำลังกาย 30 นาที', done: true, priority: 'low', due: '', category: 'health' },
  ]);
  const [text, setText] = useState('');
  const [priority, setPriority] = useState('medium');
  const [due, setDue] = useState('');
  const [category, setCategory] = useState('');
  const [filter, setFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');
  const [removing, setRemoving] = useState([]);
  const [entering, setEntering] = useState(null);

  const today = todayStr();

  const add = () => {
    const t = text.trim();
    if (!t) return;
    const id = nextId++;
    setTodos((p) => [{ id, text: t, done: false, priority, due, category }, ...p]);
    setEntering(id);
    setText('');
    setDue('');
  };

  const toggle = (id) => setTodos((p) => p.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const cyclePriority = (id) =>
    setTodos((p) => p.map((t) => (t.id === id ? { ...t, priority: ORDER[(ORDER.indexOf(t.priority) + 1) % 3] } : t)));

  const removeIds = (ids) => {
    setRemoving((r) => [...r, ...ids]);
    setTimeout(() => {
      setTodos((p) => p.filter((t) => !ids.includes(t.id)));
      setRemoving((r) => r.filter((x) => !ids.includes(x)));
    }, 280);
  };
  const remove = (id) => removeIds([id]);
  const clearCompleted = () => {
    const ids = todos.filter((t) => t.done).map((t) => t.id);
    if (ids.length) removeIds(ids);
  };

  const startEdit = (t) => { setEditingId(t.id); setDraft(t.text); };
  const saveEdit = () => {
    const v = draft.trim();
    if (v) setTodos((p) => p.map((t) => (t.id === editingId ? { ...t, text: v } : t)));
    setEditingId(null);
  };

  // ---------- derived ----------
  const completedCount = todos.filter((t) => t.done).length;
  const overdueCount = todos.filter((t) => !t.done && t.due && t.due < today).length;
  const remaining = todos.length - completedCount;
  const activeCount = remaining - overdueCount;
  const percent = todos.length ? Math.round((completedCount / todos.length) * 100) : 0;

  const q = query.trim().toLowerCase();
  const inScope = todos.filter(
    (t) => (catFilter === 'all' || t.category === catFilter) && (!q || t.text.toLowerCase().includes(q))
  );
  const counts = {
    all: inScope.length,
    active: inScope.filter((t) => !t.done).length,
    completed: inScope.filter((t) => t.done).length,
  };
  const visible = inScope.filter((t) => (filter === 'all' ? true : filter === 'active' ? !t.done : t.done));
  const catCount = (k) => todos.filter((t) => t.category === k).length;

  const emptyText = q
    ? `ไม่พบงานที่ตรงกับ "${query.trim()}"`
    : todos.length === 0
    ? 'ยังไม่มีงาน เพิ่มงานแรกของคุณได้เลย'
    : filter === 'completed'
    ? 'ยังไม่มีงานที่เสร็จ'
    : 'ไม่มีงานในหมวดนี้';

  const sideBtn = (active) =>
    'flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ' +
    (active ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-white');

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">รายการงานของฉัน</h1>
      <p className="mt-1 text-sm text-gray-500">จัดการสิ่งที่ต้องทำในแต่ละวัน</p>

      <div className="mt-6 grid gap-5 md:grid-cols-[220px_1fr]">
        {/* ---------- Sidebar ---------- */}
        <aside className="space-y-4">
          <nav aria-label="หมวดหมู่" className="flex gap-1 overflow-x-auto rounded-2xl bg-gray-200/60 p-1.5 md:flex-col md:overflow-visible">
            <button onClick={() => setCatFilter('all')} className={sideBtn(catFilter === 'all')}>
              <LayoutList size={16} /> <span className="flex-1 text-left">ทุกหมวด</span>
              <span className="text-xs opacity-70">{todos.length}</span>
            </button>
            {CAT_KEYS.map((k) => {
              const { Icon, label } = CATS[k];
              return (
                <button key={k} onClick={() => setCatFilter(k)} className={sideBtn(catFilter === k)}>
                  <Icon size={16} /> <span className="flex-1 text-left">{label}</span>
                  <span className="text-xs opacity-70">{catCount(k)}</span>
                </button>
              );
            })}
          </nav>

          <section className="rounded-2xl bg-white p-4 shadow-md" aria-label="สถิติ">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">สถิติ</h2>
            <div className="flex items-center gap-4">
              <Donut
                percent={percent}
                segments={[
                  { label: 'เสร็จแล้ว', value: completedCount, color: '#10b981' },
                  { label: 'ค้างอยู่', value: activeCount, color: '#6366f1' },
                  { label: 'เลยกำหนด', value: overdueCount, color: '#ef4444' },
                ]}
              />
              <dl className="min-w-0 flex-1 space-y-1 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">งานทั้งหมด</dt><dd className="font-semibold">{todos.length}</dd></div>
                <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-gray-500"><i className="h-2 w-2 rounded-full bg-emerald-500" />เสร็จแล้ว</dt><dd className="font-semibold">{completedCount}</dd></div>
                <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-gray-500"><i className="h-2 w-2 rounded-full bg-indigo-500" />ค้างอยู่</dt><dd className="font-semibold">{activeCount}</dd></div>
                <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-gray-500"><i className="h-2 w-2 rounded-full bg-red-500" />เลยกำหนด</dt><dd className="font-semibold">{overdueCount}</dd></div>
              </dl>
            </div>
          </section>
        </aside>

        {/* ---------- Main ---------- */}
        <main className="min-w-0">
          {/* Add form */}
          <div className="rounded-2xl bg-white p-4 shadow-md">
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
                placeholder="เพิ่มงานใหม่..."
                aria-label="เพิ่มงานใหม่"
                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-base placeholder-gray-400 focus:bg-white"
              />
              <button
                onClick={add}
                disabled={!text.trim()}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <Plus size={18} /> เพิ่ม
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">ความสำคัญ</span>
                <div className="flex rounded-xl bg-gray-100 p-1" role="radiogroup" aria-label="ความสำคัญ">
                  {ORDER.map((p) => (
                    <button
                      key={p} role="radio" aria-checked={priority === p}
                      onClick={() => setPriority(p)}
                      className={'rounded-lg px-3 py-1 text-sm font-medium transition ' + (priority === p ? PRIORITIES[p].on + ' shadow-sm' : 'text-gray-600 hover:text-gray-900')}
                    >
                      {PRIORITIES[p].label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-500">
                <CalendarDays size={16} /> กำหนดส่ง
                <input
                  type="date" value={due} onChange={(e) => setDue(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-sm text-gray-700"
                />
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="หมวดหมู่">
              <span className="text-sm text-gray-500">หมวดหมู่</span>
              {CAT_KEYS.map((k) => (
                <button
                  key={k} role="radio" aria-checked={category === k}
                  onClick={() => setCategory(category === k ? '' : k)}
                  className={'rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset transition ' + (category === k ? CATS[k].on + ' ring-transparent' : CATS[k].tag)}
                >
                  {CATS[k].label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-5">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหางาน..." aria-label="ค้นหางาน"
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-base placeholder-gray-400 shadow-sm"
            />
          </div>

          {/* Status tabs */}
          <div className="mt-3 flex gap-1 rounded-xl bg-gray-200/70 p-1" role="tablist">
            {FILTERS.map(([key, label]) => (
              <button
                key={key} role="tab" aria-selected={filter === key}
                onClick={() => setFilter(key)}
                className={'flex-1 rounded-lg px-2 py-2 text-sm font-medium transition ' + (filter === key ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900')}
              >
                {label} <span className="text-gray-400">({counts[key]})</span>
              </button>
            ))}
          </div>

          {/* List */}
          <ul className="mt-4 list-none p-0">
            {visible.length === 0 && (
              <li className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-gray-500 shadow">{emptyText}</li>
            )}
            {visible.map((t) => {
              const badge = dueBadge(t, today);
              const cat = CATS[t.category];
              return (
                <li key={t.id} className={'row mb-3 ' + (removing.includes(t.id) ? 'removing' : '') + (entering === t.id ? ' entering' : '')}>
                  <div className="flex items-center gap-3 rounded-2xl bg-white py-3 pl-3 pr-2 shadow transition hover:shadow-md">
                    <span className={'h-10 w-1 shrink-0 rounded-full ' + PRIORITIES[t.priority].bar} />
                    <button
                      onClick={() => toggle(t.id)} role="checkbox" aria-checked={t.done}
                      aria-label={t.done ? 'ทำเครื่องหมายว่ายังไม่เสร็จ' : 'ทำเครื่องหมายว่าเสร็จแล้ว'}
                      className={'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ' + (t.done ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-white text-transparent hover:border-indigo-400')}
                    >
                      <Check size={14} />
                    </button>

                    <div className="min-w-0 flex-1">
                      {editingId === t.id ? (
                        <input
                          autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                          onBlur={saveEdit} aria-label="แก้ไขงาน"
                          className="w-full rounded-lg border border-indigo-300 bg-white px-2 py-1 text-base"
                        />
                      ) : (
                        <span
                          onDoubleClick={() => startEdit(t)} title="ดับเบิลคลิกเพื่อแก้ไข"
                          className={'block cursor-text select-none break-words text-base ' + (t.done ? 'text-gray-400 line-through' : 'text-gray-800')}
                        >
                          {t.text}
                        </span>
                      )}
                      {(cat || badge) && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {cat && <span className={'rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ' + cat.tag}>{cat.label}</span>}
                          {badge && (
                            <span className={'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ' + badge.cls}>
                              <CalendarDays size={12} /> {badge.text}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => cyclePriority(t.id)} title="แตะเพื่อเปลี่ยนความสำคัญ"
                      className={'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ' + PRIORITIES[t.priority].badge}
                    >
                      {PRIORITIES[t.priority].label}
                    </button>
                    <button
                      onClick={() => remove(t.id)} aria-label="ลบงาน"
                      className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {todos.length > 0 && (
            <div className="mt-2 flex items-center justify-between px-1 text-sm text-gray-600">
              <span>เหลือ <strong className="text-gray-900">{remaining}</strong> งาน</span>
              <button
                onClick={clearCompleted} disabled={completedCount === 0}
                className="rounded-lg px-3 py-1.5 font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
              >
                ล้างงานที่เสร็จแล้ว
              </button>
            </div>
          )}
          <p className="mt-6 text-center text-xs text-gray-400">
            ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · แตะป้ายความสำคัญเพื่อเปลี่ยนระดับ
          </p>
        </main>
      </div>
    </div>
  );
}