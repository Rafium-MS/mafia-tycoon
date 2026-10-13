// src/data/businesses.ts
import type { Business, BusinessId } from '../types/game';

export const BUSINESS_DEFS: Record<BusinessId, Omit<Business, 'count' | 'unlocked'>> = {
  loan_shark: {
    id: 'loan_shark',
    name: 'Agiotagem',
    description: 'Empréstimos com juros "amigáveis"',
    baseCost: 15,
    baseIncome: 1,
    baseHeat: 0.2,
    baseRespect: 0.005,
    requiresRespect: 0,
  },
  protection: {
    id: 'protection',
    name: 'Esquema de Proteção',
    description: 'Lojas que "precisam" de segurança',
    baseCost: 100,
    baseIncome: 8,
    baseHeat: 0.8,
    baseRespect: 0.02,
    requiresRespect: 10,
  },
  numbers: {
    id: 'numbers',
    name: 'Jogo do Bicho',
    description: 'Aposta ilegal, dinheiro rápido',
    baseCost: 800,
    baseIncome: 50,
    baseHeat: 3,
    baseRespect: 0.1,
    requiresRespect: 50,
  },
  smuggling: {
    id: 'smuggling',
    name: 'Contrabando',
    description: 'Mercadoria que "caiu do caminhão"',
    baseCost: 5000,
    baseIncome: 300,
    baseHeat: 8,
    baseRespect: 0.4,
    requiresRespect: 200,
  },
  casino: {
    id: 'casino',
    name: 'Cassino Clandestino',
    description: 'A casa sempre ganha',
    baseCost: 50000,
    baseIncome: 2500,
    baseHeat: 15,
    baseRespect: 1,
    requiresRespect: 1000,
  },
};

// Custo cresce 1.15x por unidade comprada
export const COST_MULTIPLIER = 1.15;