import { NavLink, Link } from 'react-router-dom'
import { analytics } from '../analytics/index.js'
import { formatDate, formatNumber } from '../utils/format.js'

const NAV = [
  { to: '/', label: 'Overview', end: true },
  { to: '/segments', label: 'Customer Segments' },
  { to: '/opportunities', label: 'Opportunities' },
  { to: '/strategy', label: 'Strategy' },
]

// 3×3 dot mark: a quiet nod to the data grid, with one highlighted signal.
function LogoMark() {
  const dots = [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => ({ r, c })))
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#1b2140" />
      <rect x="0.5" y="0.5" width="23" height="23" rx="5.5" fill="none" stroke="#ffffff" strokeOpacity="0.12" />
      {dots.map(({ r, c }) => {
        const highlight = r === 0 && c === 2
        const opacity = highlight ? 1 : 0.22 + (c + (2 - r)) * 0.12
        return <circle key={`${r}${c}`} cx={7 + c * 5} cy={7 + r * 5} r={1.35} fill={highlight ? '#a5b4fc' : '#ffffff'} opacity={opacity} />
      })}
    </svg>
  )
}

export default function Layout({ children }) {
  const { kpis, meta } = analytics
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#080b16]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] max-w-7xl items-center gap-10 px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <LogoMark />
            <span className="text-[14px] font-semibold tracking-[-0.015em] text-white">Personalization Intelligence</span>
          </Link>
          <nav className="flex h-full items-center gap-0.5 overflow-x-auto">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative flex h-full items-center whitespace-nowrap px-3 text-[13.5px] transition-colors duration-150 ${
                    isActive
                      ? 'font-medium text-white after:absolute after:inset-x-3 after:-bottom-px after:h-[1.5px] after:bg-[#a5b4fc]'
                      : 'text-[#9aa4b8] hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <a
            href={meta.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto hidden shrink-0 items-center gap-2 text-[12px] text-[#8590a6] transition-colors hover:text-white lg:flex"
            title={meta.citation}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#1baf7a]" />
            Real data · {meta.publisher.replace(' Machine Learning Repository', '')} {meta.name}
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 pt-12 pb-16">{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-7 text-[11.5px] leading-relaxed text-ink-3 md:flex-row md:justify-between md:gap-10">
          <p>
            Data:{' '}
            <a href={meta.url} target="_blank" rel="noopener noreferrer" className="underline decoration-line underline-offset-2 hover:text-ink">
              {meta.citation.split(' [Dataset]')[0]}
            </a>{' '}
            ({meta.license}) — real transactions of an anonymised UK online gift retailer · {formatNumber(kpis.transactionRows)} cleaned
            line items · {formatDate(kpis.startDate)} – {formatDate(kpis.endDate)} · values in GBP.
          </p>
          <p className="md:text-right">
            The Personalization Opportunity Score is a prioritization framework, not a causal or predictive measure of ROI.
          </p>
        </div>
      </footer>
    </div>
  )
}
