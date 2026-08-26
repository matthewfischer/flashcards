export const PERFORMANCE_RANKING = [
  { name: 'GPU local HBM', speed: 'fastest' },
  { name: 'NVLink', speed: 'very fast' },
  { name: 'PCIe', speed: 'slower' },
  { name: 'InfiniBand', speed: 'slower still' },
  { name: 'Ethernet', speed: 'slowest' },
] as const

export default function PerformanceRanking() {
  return (
    <section className="performance-ranking" aria-labelledby="performance-ranking-title">
      <div className="performance-ranking-header">
        <div>
          <div className="eyebrow">Reference</div>
          <h2 id="performance-ranking-title">GPU data paths</h2>
        </div>
        <span className="ranking-direction" aria-label="Fastest to slowest">
          Fastest → slowest
        </span>
      </div>
      <ol className="ranking-list">
        {PERFORMANCE_RANKING.map((item, index) => (
          <li key={item.name} className="ranking-item">
            <span className="ranking-number">{index + 1}</span>
            <span className="ranking-name">{item.name}</span>
            <span className="ranking-speed">{item.speed}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}