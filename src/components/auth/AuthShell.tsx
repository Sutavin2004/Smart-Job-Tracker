import Link from 'next/link'

const SAMPLE = [
  { company: 'Fieldnote', role: 'Frontend Engineer', stage: 'Interview', day: 'Today' },
  { company: 'Copperline', role: 'Software Engineer II', stage: 'Applied', day: 'Mon' },
  { company: 'Harbor & Pine', role: 'Full Stack Developer', stage: 'Offer', day: 'Fri' },
  { company: 'Ordinal Health', role: 'Platform Engineer', stage: 'Applied', day: 'Thu' },
  { company: 'Northwind Labs', role: 'React Developer', stage: 'Saved', day: 'Wed' },
  { company: 'Basalt', role: 'Product Engineer', stage: 'Rejected', day: 'Oct 28' },
]

const STAGE_STYLE: Record<string, string> = {
  Offer: 'bg-white text-brand-800',
  Interview: 'bg-white/15 text-white',
  Applied: 'text-white/80 ring-1 ring-inset ring-white/25',
  Saved: 'text-white/60 ring-1 ring-inset ring-white/15',
  Rejected: 'text-white/45 line-through decoration-white/30',
}

/** Two-column frame for the sign-in and sign-up pages. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-white dark:bg-[#121314] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-700 p-10 text-white lg:flex xl:p-14">
        <Link href="/login" className="text-[15px] font-semibold tracking-tight">JobTrack</Link>

        <div className="max-w-md">
          <h2 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.015em] xl:text-[32px]">
            Every application in one place, and a short list of new jobs worth your time each morning.
          </h2>

          <table className="mt-10 w-full text-left text-[13px]" aria-label="Example applications">
            <thead>
              <tr className="border-b border-white/20 text-white/60">
                <th scope="col" className="pb-2.5 font-normal">Company</th>
                <th scope="col" className="hidden pb-2.5 font-normal xl:table-cell">Role</th>
                <th scope="col" className="pb-2.5 font-normal">Stage</th>
                <th scope="col" className="pb-2.5 text-right font-normal">Updated</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE.map(r => (
                <tr key={r.company} className="border-b border-white/10 last:border-0">
                  <td className="py-2.5 pr-3 font-medium">{r.company}</td>
                  <td className="hidden py-2.5 pr-3 text-white/75 xl:table-cell">{r.role}</td>
                  <td className="py-2.5 pr-3">
                    <span className={`inline-block rounded px-1.5 py-0.5 text-[12px] font-medium ${STAGE_STYLE[r.stage]}`}>{r.stage}</span>
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-white/60">{r.day}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="max-w-sm text-[13px] leading-relaxed text-white/65">
          The job agent searches public boards, scores each listing against your profile, and adds the good ones to your board.
        </p>
      </aside>

      <main className="flex flex-col px-6 py-8 sm:px-10">
        <Link href="/login" className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white lg:hidden">JobTrack</Link>
        <div className="mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center py-12">
          {children}
        </div>
      </main>
    </div>
  )
}
