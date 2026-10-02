import { useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';

const PRIORITIES = {
  low:    { label: 'ต่ำ',   badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', bar: 'bg-emerald-400', on: 'bg-emerald-500 text-white' },
  medium: { label: 'กลาง', badge: 'bg-amber-50 text-amber-700 ring-amber-200',       bar: 'bg-amber-400',   on: 'bg-amber-500 text-white' },
  high:   { label: 'สูง',   badge: 'bg-rose-50 text-rose-700 ring-rose-200',          bar: 'bg-rose-500',    on: 'bg-rose-500 text-white' },
};
const ORDER = ['low', 'medium', 'high'];
const FILTERS = [
  ['all', 'ทั้งหมด'],
  ['active', 'ยังไม่เสร็จ'],
  ['completed', 'เสร็จแล้ว'],
];

let nextId = 4;

export default function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'ส่งรายงานให้อาจารย์', done: false, priority: 'high' },
    { id: 2, text: 'ซื้อของเข้าบ้าน', done: false, priority: 'medium' },
    { id: 3, text: 'อ่านหนังสือ 30 นาที', done: true, priority: 'low' },
  ]);
  const [text, setText] = useState('');
  const [priority, setPriority] = useState('medium');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');
  const [removing, setRemoving] = useState([]);
  const [entering, setEntering] = useState(null);

  const add = () => {
    const t = text.trim();
    if (!t) return;
    const id = nextId++;
    setTodos((prev) => [{ id, text: t, done: false, priority }, ...prev]);
    setEntering(id);
    setText('');
  };

  const toggle = (id) =>
    setTodos((p) => p.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const cyclePriority = (id) =>
    setTodos((p) =>
      p.map((t) =>
        t.id === id ? { ...t, priority: ORDER[(ORDER.indexOf(t.priority) + 1) % 3] } : t
      )
    );

  const remove = (id) => {
    setRemoving((r) => [...r, id]);
    setTimeout(() => {
      setTodos((p) => p.filter((t) => t.id !== id));
      setRemoving((r) => r.filter((x) => x !== id));
    }, 280);
  };

  const clearCompleted = () => {
    const ids = todos.filter((t) => t.done).map((t) => t.id);
    if (!ids.length) return;
    setRemoving((r) => [...r, ...ids]);
    setTimeout(() => {
      setTodos((p) => p.filter((t) => !t.done));
      setRemoving((r) => r.filter((x) => !ids.includes(x)));
    }, 280);
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setDraft(t.text);
  };
  const saveEdit = () => {
    const v = draft.trim();
    if (v) setTodos((p) => p.map((t) => (t.id === editingId ? { ...t, text: v } : t)));
    setEditingId(null);
  };

  const remaining = todos.filter((t) => !t.done).length;
  const completedCount = todos.length - remaining;
  const counts = { all: todos.length, active: remaining, completed: completedCount };
  const visible = todos.filter((t) =>
    filter === 'all' ? true : filter === 'active' ? !t.done : t.done
  );

  const emptyText =
    todos.length === 0
      ? 'ยังไม่มีงาน เพิ่มงานแรกของคุณได้เลย'
      : filter === 'active'
      ? 'ไม่มีงานที่ค้างอยู่ เยี่ยมมาก!'
      : 'ยังไม่มีงานที่เสร็จ';

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">รายการงานของฉัน</h1>
      <p className="mt-1 text-sm text-gray-500">จัดการสิ่งที่ต้องทำในแต่ละวัน</p>

      {/* Add form */}
      <div className="mt-6 rounded-2xl bg-white p-4 shadow-md">
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
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-gray-500">ความสำคัญ</span>
          <div className="flex rounded-xl bg-gray-100 p-1" role="radiogroup" aria-label="ความสำคัญ">
            {ORDER.map((p) => (
              <button
                key={p}
                role="radio"
                aria-checked={priority === p}
                onClick={() => setPriority(p)}
                className={
                  'rounded-lg px-3 py-1 text-sm font-medium transition ' +
                  (priority === p ? PRIORITIES[p].on + ' shadow-sm' : 'text-gray-600 hover:text-gray-900')
                }
              >
                {PRIORITIES[p].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mt-5 flex gap-1 rounded-xl bg-gray-200/70 p-1" role="tablist">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={filter === key}
            onClick={() => setFilter(key)}
            className={
              'flex-1 rounded-lg px-2 py-2 text-sm font-medium transition ' +
              (filter === key ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900')
            }
          >
            {label} <span className="text-gray-400">({counts[key]})</span>
          </button>
        ))}
      </div>

      {/* List */}
      <ul className="mt-4 list-none p-0">
        {visible.length === 0 && (
          <li className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-gray-500 shadow">
            {emptyText}
          </li>
        )}
        {visible.map((t) => (
          <li
            key={t.id}
            className={
              'row mb-3 ' +
              (removing.includes(t.id) ? 'removing' : '') +
              (entering === t.id ? ' entering' : '')
            }
          >
            <div className="flex items-center gap-3 rounded-2xl bg-white py-3 pl-3 pr-2 shadow transition hover:shadow-md">
              <span className={'h-8 w-1 shrink-0 rounded-full ' + PRIORITIES[t.priority].bar} />
              <button
                onClick={() => toggle(t.id)}
                role="checkbox"
                aria-checked={t.done}
                aria-label={t.done ? 'ทำเครื่องหมายว่ายังไม่เสร็จ' : 'ทำเครื่องหมายว่าเสร็จแล้ว'}
                className={
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ' +
                  (t.done
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-gray-300 bg-white text-transparent hover:border-indigo-400')
                }
              >
                <Check size={14} />
              </button>

              <div className="min-w-0 flex-1">
                {editingId === t.id ? (
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={saveEdit}
                    aria-label="แก้ไขงาน"
                    className="w-full rounded-lg border border-indigo-300 bg-white px-2 py-1 text-base"
                  />
                ) : (
                  <span
                    onDoubleClick={() => startEdit(t)}
                    title="ดับเบิลคลิกเพื่อแก้ไข"
                    className={
                      'block cursor-text select-none break-words text-base ' +
                      (t.done ? 'text-gray-400 line-through' : 'text-gray-800')
                    }
                  >
                    {t.text}
                  </span>
                )}
              </div>

              <button
                onClick={() => cyclePriority(t.id)}
                title="แตะเพื่อเปลี่ยนความสำคัญ"
                className={
                  'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ' +
                  PRIORITIES[t.priority].badge
                }
              >
                {PRIORITIES[t.priority].label}
              </button>
              <button
                onClick={() => remove(t.id)}
                aria-label="ลบงาน"
                className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Footer */}
      {todos.length > 0 && (
        <div className="mt-2 flex items-center justify-between px-1 text-sm text-gray-600">
          <span>
            เหลือ <strong className="text-gray-900">{remaining}</strong> งาน
          </span>
          <button
            onClick={clearCompleted}
            disabled={completedCount === 0}
            className="rounded-lg px-3 py-1.5 font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
          >
            ล้างงานที่เสร็จแล้ว
          </button>
        </div>
      )}
      <p className="mt-6 text-center text-xs text-gray-400">
        ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · แตะป้ายความสำคัญเพื่อเปลี่ยนระดับ
      </p>
    </div>
  );
}
