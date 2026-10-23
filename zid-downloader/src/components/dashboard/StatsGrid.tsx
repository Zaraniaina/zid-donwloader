import { CheckCircle2, Clock3, Gauge } from 'lucide-react'

type StatsGridProps = {
  active: number
  completed: number
  queued: number
  speedText: string
}

export function StatsGrid({ active, completed, queued, speedText }: StatsGridProps) {
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
            <Gauge size={14} />
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
          <span className="stat-label">En attente</span>
          <Clock3 size={15} />
        </div>
        <div className="stat-value">{queued}</div>
        <p className="stat-foot">tâches dans la file</p>
      </article>
    </section>
  )
}
