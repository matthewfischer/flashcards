import { describe, expect, it } from 'vitest'
import { PERFORMANCE_RANKING } from './PerformanceRanking'

describe('GPU data path ranking', () => {
  it('keeps the paths ordered from fastest to slowest', () => {
    expect(PERFORMANCE_RANKING.map((item) => item.name)).toEqual([
      'GPU local HBM',
      'NVLink',
      'PCIe',
      'InfiniBand',
      'Ethernet',
    ])
  })

  it('describes each path speed', () => {
    expect(PERFORMANCE_RANKING.map((item) => item.speed)).toEqual([
      'fastest',
      'very fast',
      'slower',
      'slower still',
      'slowest',
    ])
  })
})