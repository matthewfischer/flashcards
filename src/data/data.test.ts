import { describe, it, expect } from 'vitest'
import { ALL_CARDS, VENDORS, CATEGORIES } from './index'
import type { Difficulty } from '../types'

const DIFFICULTIES: Difficulty[] = ['foundational', 'intermediate', 'advanced']

describe('card data integrity', () => {
  it('loads a non-trivial number of cards', () => {
    expect(ALL_CARDS.length).toBeGreaterThan(20)
  })

  it('has a unique id for every card', () => {
    const ids = ALL_CARDS.map((c) => c.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('has required, non-empty string fields on every card', () => {
    for (const card of ALL_CARDS) {
      expect(card.id, `id missing`).toBeTruthy()
      expect(card.term, `term missing on ${card.id}`).toBeTruthy()
      expect(card.definition, `definition missing on ${card.id}`).toBeTruthy()
      expect(card.vendor, `vendor missing on ${card.id}`).toBeTruthy()
      expect(card.category, `category missing on ${card.id}`).toBeTruthy()
      expect(typeof card.definition).toBe('string')
    }
  })

  it('uses only valid difficulty values when present', () => {
    for (const card of ALL_CARDS) {
      if (card.difficulty !== undefined) {
        expect(DIFFICULTIES, `bad difficulty on ${card.id}`).toContain(card.difficulty)
      }
    }
  })

  it('has array tags when tags are present', () => {
    for (const card of ALL_CARDS) {
      if (card.tags !== undefined) {
        expect(Array.isArray(card.tags), `tags not array on ${card.id}`).toBe(true)
      }
    }
  })

  it('has valid links when links are present', () => {
    for (const card of ALL_CARDS) {
      if (card.links !== undefined) {
        expect(Array.isArray(card.links), `links not array on ${card.id}`).toBe(true)
        for (const link of card.links) {
          expect(link.label, `link label missing on ${card.id}`).toBeTruthy()
          expect(link.url, `link url missing on ${card.id}`).toBeTruthy()
          expect(/^https?:\/\//.test(link.url), `link url not http(s) on ${card.id}`).toBe(true)
        }
      }
    }
  })

  it('derives VENDORS from the actual card data', () => {
    const fromCards = new Set(ALL_CARDS.map((c) => c.vendor))
    expect(new Set(VENDORS)).toEqual(fromCards)
    expect(VENDORS).toContain('HPE')
    expect(VENDORS).toContain('NVIDIA')
  })

  it('derives CATEGORIES from the actual card data', () => {
    const fromCards = new Set(ALL_CARDS.map((c) => c.category))
    expect(new Set(CATEGORIES)).toEqual(fromCards)
  })

  it('keeps definitions reasonably concise for quick review', () => {
    for (const card of ALL_CARDS) {
      expect(card.definition.length, `definition too long on ${card.id}`).toBeLessThan(400)
    }
  })

  it('keeps GPU study focused on architecture generations', () => {
    const gpuTerms = ALL_CARDS.filter((card) => card.category === 'GPU').map((card) => card.term)

    expect(gpuTerms).toEqual([
      'AMD Instinct MI300 (CDNA 3)',
      'AMD Instinct MI350 (CDNA 4)',
      'AMD Instinct MI400',
      'NVIDIA Hopper (H100 / H200)',
      'NVIDIA Blackwell (B100 / B200 / GB200)',
      'NVIDIA Rubin GPU',
    ])
    expect(gpuTerms).not.toEqual(expect.arrayContaining(['NVIDIA H200', 'NVIDIA GB200 (Grace Blackwell)']))
    expect(gpuTerms).not.toEqual(expect.arrayContaining(['AMD Instinct MI325X', 'AMD Instinct MI300A (APU)']))
  })

  it('uses one card for the FP16 to FP4 precision tradeoff', () => {
    const precisionTerms = ALL_CARDS.filter((card) => card.category === 'Numeric Formats').map(
      (card) => card.term,
    )

    expect(precisionTerms).toContain('FP16 → FP8 → FP4')
    expect(precisionTerms).not.toEqual(expect.arrayContaining(['FP16 (half precision)', 'FP8', 'FP4']))
  })
})
