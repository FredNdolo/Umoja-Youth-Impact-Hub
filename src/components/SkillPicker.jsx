// LinkedIn-style skill picker: type to get suggestions, pick with mouse or
// keyboard (↑ ↓ Enter), or add your own. Chosen skills show as chips.
import React, { useId, useMemo, useRef, useState } from 'react';
import { suggestSkills, cleanSkill, sameSkill } from '../lib/skills';

export default function SkillPicker({ value, onChange, max = 40, placeholder = 'Type a skill, e.g. photography', label = 'Skills', compact }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listId = useId();

  const suggestions = useMemo(() => suggestSkills(q, value, 8), [q, value]);
  const custom = cleanSkill(q);
  const showCustom = custom && !suggestions.some((s) => sameSkill(s, custom)) && !value.some((s) => sameSkill(s, custom));
  const options = showCustom ? [...suggestions, { custom }] : suggestions;
  const full = value.length >= max;

  const add = (skill) => {
    const s = cleanSkill(skill);
    if (!s || full || value.some((v) => sameSkill(v, s))) return;
    onChange([...value, s]);
    setQ(''); setActive(0);
    setOpen(false); // reopens as soon as they type again
    inputRef.current?.focus();
  };
  const remove = (skill) => onChange(value.filter((v) => v !== skill));

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' || e.key === ',') {
      if (!q.trim() && e.key === 'Enter') return;
      e.preventDefault();
      const o = options[active];
      add(o ? (o.custom || o) : q);
    } else if (e.key === 'Backspace' && !q && value.length) {
      remove(value[value.length - 1]);
    } else if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div>
      {label && <span className="input-label block">{label}</span>}

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2 mb-2.5" aria-label="Chosen skills">
          {value.map((s) => (
            <li key={s} className="inline-flex items-center gap-1 rounded-full bg-forest text-cream pl-3 pr-1 py-1 text-sm">
              {s}
              <button type="button" onClick={() => remove(s)} aria-label={`Remove ${s}`}
                className="w-6 h-6 rounded-full hover:bg-cream/20 leading-none text-base">×</button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open && options.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
          value={q}
          disabled={full}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder={full ? `Maximum of ${max} skills` : placeholder}
          className={compact
            ? 'w-full rounded-md border border-sand-dark bg-white px-3 py-2 text-sm focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20'
            : 'input-field'}
          maxLength={60}
        />
        {open && options.length > 0 && !full && (
          <ul id={listId} role="listbox"
            className="absolute z-20 left-0 right-0 mt-1 bg-white border border-sand-dark rounded-md shadow-card-lg overflow-hidden max-h-72 overflow-y-auto">
            {!q.trim() && <li className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wide text-ink-faint">Popular</li>}
            {options.map((o, i) => (
              <li key={o.custom ? `custom-${o.custom}` : o} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                <button type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => add(o.custom || o)}
                  className={`w-full text-left px-3 py-2 text-sm ${i === active ? 'bg-sand-light' : ''}`}>
                  {o.custom ? <>Add “<strong>{o.custom}</strong>”</> : o}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {!compact && <p className="font-sans text-xs text-ink-faint mt-1.5">Pick from the suggestions or type your own and press Enter.</p>}
    </div>
  );
}
