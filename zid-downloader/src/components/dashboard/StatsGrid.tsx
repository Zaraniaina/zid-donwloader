import { CheckCircle2, HardDrive, Sparkles } from 'lucide-react'

type StatsGridProps = {
  active: number
  completed: number
  speedText: string
}

export function StatsGrid({ active, completed, speedText }: StatsGridProps) {
  return (
    <section className="stats-grid">
      <article className="stat-card accent">
        <div className="stat-label-row">
          <span className="stat-label">Actifs</span>
          <span className="dot active-dot" />
        </div>
        <div className="stat-value">{active}</div>
        <p className="stat-foot">téléchargements en cours</p>
      </article>

      <article className="stat-card">
        <div className="stat-label-row">
          <span className="stat-label">Vitesse</span>
          <span className="mini-icon">
            <Sparkles size={14} />
          </span>
        </div>
        <div className="stat-value">{speedText}</div>
        <p className="stat-foot">débit global</p>
      </article>

      <article className="stat-card">
        <div className="stat-label-row">
          <span className="stat-label">Terminé</span>
          <CheckCircle2 size={15} />
        </div>
        <div className="stat-value">{completed}</div>
        <p className="stat-foot">fichiers validés</p>
      </article>

      <article className="stat-card">
        <div className="stat-label-row">
          <span className="stat-label">Stockage</span>
          <HardDrive size={15} />
        </div>
        <div className="stat-value">82%</div>
        <p className="stat-foot">disponible</p>
      </article>
    </section>
  )
}
