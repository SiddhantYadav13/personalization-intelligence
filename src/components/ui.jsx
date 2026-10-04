import { useState } from 'react'
import { Info } from 'lucide-react'
import { SEGMENTS } from '../analytics/segments.js'
import { QUADRANTS } from '../analytics/opportunity.js'
import SilkBackground from './SilkBackground.jsx'

// Full-bleed dark band at the top of each page. It slides up under the sticky
// header (60px) and the main top padding (48px) so the two read as one surface.
export function Band({ children, intensity = 0.75, className = '' }) {
  return (
    <section
      className={`band relative isolate -mt-[108px] mx-[calc(50%-50vw)] overflow-hidden pt-[60px] text-white ${className}`}
    >
      <SilkBackground intensity={intensity} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/[0.06]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-6">{children}</div>
    </section>
  )
}

export function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <Band className="mb-10">
      <div className="flex flex-col gap-6 pt-14 pb-12 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          {eyebrow && <p className="eyebrow mb-3 text-[#a5b4fc]">{eyebrow}</p>}
          <h1 className="text-[32px] font-semibold leading-[1.15] tracking-[-0.025em] text-white">{title}</h1>
          {subtitle && <p className="mt-3 text-[15px] leading-relaxed text-[#9aa4b8]">{subtitle}</p>}
        </div>
        {children}
      </div>
    </Band>
  )
}

export function Card({ title, subtitle, action, children, className = '', bodyClassName = '', variant }) {
  return (
    <section className={`card-accent rounded-xl border ${variant === 'chart' ? 'card-chart' : ''} ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-line-2 px-6 pt-5 pb-4">
          <div>
            <h2 className="text-[14.5px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
            {subtitle && <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={bodyClassName || 'p-6'}>{children}</div>
    </section>
  )
}

export function SegmentDot({ color, size = 10 }) {
  return <span className="inline-block shrink-0 rounded-full" style={{ background: color, width: size, height: size }} />
}

export function SegmentLegend({ segments = SEGMENTS }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {segments.map((s) => (
        <span key={s.id} className="flex items-center gap-1.5 text-[11.5px] text-ink-2">
          <SegmentDot color={s.color} size={7} />
          {s.short}
        </span>
      ))}
    </div>
  )
}

export function ScoreBar({ value, color = '#4f46e5', label }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-line-2" role="presentation">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(2, value)}%`, background: color }} />
      </div>
      <span className="tabular w-8 text-right text-[13px] font-medium text-ink">{label ?? Math.round(value)}</span>
    </div>
  )
}

export function InfoTooltip({ children, label = 'More information', align = 'right' }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="rounded-full p-0.5 text-ink-3 transition-colors hover:text-accent"
      >
        <Info className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
      {open && (
        <span
          role="tooltip"
          className={`animate-fade-up absolute top-7 z-40 w-80 rounded-lg border border-line bg-white p-4 text-left text-[12.5px] font-normal normal-case leading-relaxed tracking-normal text-ink-2 shadow-[0_12px_32px_-12px_rgba(17,24,39,0.22)] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {children}
        </span>
      )}
    </span>
  )
}

const QUADRANT_STYLES = {
  prioritize: 'bg-accent-soft text-accent ring-accent-line',
  maintain: 'bg-[#f1f5fb] text-[#3b5b8c] ring-[#dde6f2]',
  test: 'bg-white text-ink-2 ring-line',
  deprioritize: 'bg-line-2 text-ink-3 ring-transparent',
}

export function QuadrantBadge({ quadrant }) {
  return (
    <span
      className={`inline-flex items-center rounded-[5px] px-1.5 py-[3px] text-[10px] font-semibold uppercase leading-none tracking-[0.09em] ring-1 ring-inset ${QUADRANT_STYLES[quadrant]}`}
    >
      {QUADRANTS[quadrant].label}
    </span>
  )
}

// Segmented-control style single-select used as the segment filter.
export function SegmentFilter({ value, onChange, includeAll = true, tone = 'light' }) {
  const options = [...(includeAll ? [{ id: 'all', short: 'All segments' }] : []), ...SEGMENTS]
  const dark = tone === 'dark'
  return (
    <div
      className={`inline-flex flex-wrap gap-0.5 rounded-lg p-[3px] ${
        dark ? 'bg-white/[0.06] ring-1 ring-inset ring-white/10 backdrop-blur-sm' : 'bg-[#eef0f3]'
      }`}
      role="tablist"
      aria-label="Segment filter"
    >
      {options.map((o) => {
        const active = value === o.id
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-all duration-150 ${
              active
                ? 'bg-white text-ink shadow-[0_1px_2px_rgba(17,24,39,0.08),0_0_0_1px_rgba(17,24,39,0.04)]'
                : dark
                  ? 'text-[#b4bccb] hover:text-white'
                  : 'text-ink-2 hover:text-ink'
            }`}
          >
            {o.color && <SegmentDot color={o.color} size={6} />}
            {o.short}
          </button>
        )
      })}
    </div>
  )
}

export function ChartTooltipBox({ children }) {
  return (
    <div className="min-w-[180px] rounded-lg border border-line bg-white/98 px-3.5 py-3 text-xs shadow-[0_12px_32px_-12px_rgba(17,24,39,0.22)]">
      {children}
    </div>
  )
}

export function TooltipRow({ label, value }) {
  return (
    <div className="flex justify-between gap-6 py-[3px]">
      <span className="text-ink-3">{label}</span>
      <span className="tabular font-medium text-ink">{value}</span>
    </div>
  )
}

export function Stat({ label, value, sub }) {
  return (
    <div>
      <p className="text-[11.5px] text-ink-3">{label}</p>
      <p className="tabular mt-1 text-[18px] font-medium tracking-[-0.015em] text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-[11.5px] text-ink-3">{sub}</p>}
    </div>
  )
}
