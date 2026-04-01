import type { ICategory, IDonation } from '../types/donation'
import type { IFamily } from '../types/family'

import { colors } from '../theme/colors'

const categoryRoupas: ICategory = {
  id: 'cat-roupas',
  name: 'Roupas',
  measure_unity: 'peça',
  active: true,
}

const categoryHigiene: ICategory = {
  id: 'cat-higiene',
  name: 'Higiene',
  measure_unity: 'kit',
  active: true,
}

const categoryAlimentacao: ICategory = {
  id: 'cat-alimentacao',
  name: 'Alimentação',
  measure_unity: 'kg',
  active: true,
}

const categoryCalcados: ICategory = {
  id: 'cat-calcados',
  name: 'Calçados',
  measure_unity: 'par',
  active: true,
}

/** Mocks completos de `IDonation` com `category` para agregações nos gráficos. */
export const mockChartDonations: IDonation[] = [
  {
    id: 'don-1',
    category_id: categoryRoupas.id,
    category: categoryRoupas,
    name: 'Cobertores',
    description: 'Inverno',
    initial_quantity: 120,
    current_quantity: 78,
    donator_name: 'Campanha Inverno',
    active: true,
    available: true,
  },
  {
    id: 'don-2',
    category_id: categoryRoupas.id,
    category: categoryRoupas,
    name: 'Jaquetas infantis',
    initial_quantity: 45,
    current_quantity: 12,
    donator_name: 'Escola Municipal X',
    active: true,
    available: true,
  },
  {
    id: 'don-3',
    category_id: categoryHigiene.id,
    category: categoryHigiene,
    name: 'Kits sabonete',
    initial_quantity: 200,
    current_quantity: 155,
    active: true,
    available: true,
  },
  {
    id: 'don-4',
    category_id: categoryAlimentacao.id,
    category: categoryAlimentacao,
    name: 'Cestas básicas',
    initial_quantity: 80,
    current_quantity: 22,
    active: true,
    available: true,
  },
  {
    id: 'don-5',
    category_id: categoryCalcados.id,
    category: categoryCalcados,
    name: 'Tênis adulto',
    initial_quantity: 60,
    current_quantity: 41,
    active: true,
    available: true,
  },
  {
    id: 'don-6',
    category_id: categoryHigiene.id,
    category: categoryHigiene,
    name: 'Fraldas',
    initial_quantity: 300,
    current_quantity: 280,
    active: true,
    available: true,
  },
]

/** Mocks de `IFamily` para distribuição (ex.: por cidade). */
export const mockChartFamilies: IFamily[] = [
  {
    id: 'fam-1',
    name: 'Silva',
    street: 'Rua das Flores',
    number: '120',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    cep: '01001000',
    active: true,
  },
  {
    id: 'fam-2',
    name: 'Oliveira',
    street: 'Av. Brasil',
    number: '450',
    neighborhood: 'Jardim Europa',
    city: 'São Paulo',
    state: 'SP',
    cep: '01415000',
    active: true,
  },
  {
    id: 'fam-3',
    name: 'Santos',
    street: 'Rua do Sol',
    number: '88',
    neighborhood: 'Vila Nova',
    city: 'Campinas',
    state: 'SP',
    cep: '13000000',
    active: true,
  },
  {
    id: 'fam-4',
    name: 'Costa',
    street: 'Rua Ipê',
    number: '15',
    neighborhood: 'Jardim Paulista',
    city: 'Campinas',
    state: 'SP',
    cep: '13040000',
    active: true,
  },
  {
    id: 'fam-5',
    name: 'Lima',
    street: 'Rua 7',
    number: '2000',
    neighborhood: 'Setor Oeste',
    city: 'Goiânia',
    state: 'GO',
    cep: '74000000',
    active: true,
  },
  {
    id: 'fam-6',
    name: 'Pereira',
    street: 'Alameda dos Anjos',
    number: '3',
    neighborhood: 'Boa Vista',
    city: 'Recife',
    state: 'PE',
    cep: '50000000',
    active: true,
  },
]

export type CategoryStockRow = { category: string; quantity: number }

export function aggregateStockByCategory(donations: IDonation[]): CategoryStockRow[] {
  const map = new Map<string, number>()
  for (const d of donations) {
    const label = d.category?.name ?? d.category_id
    map.set(label, (map.get(label) ?? 0) + d.current_quantity)
  }
  return Array.from(map.entries()).map(([category, quantity]) => ({ category, quantity }))
}

export type FamilyCitySlice = { label: string; value: number; color: string }

const piePalette = [
  colors.primary,
  colors.secondary,
  colors.success,
  colors.tertiary,
  colors.warning_light,
  colors.danger_hover,
] as const

export function familiesByCitySlices(families: IFamily[]): FamilyCitySlice[] {
  const map = new Map<string, number>()
  for (const f of families) {
    map.set(f.city, (map.get(f.city) ?? 0) + 1)
  }
  return Array.from(map.entries()).map(([label, value], i) => ({
    label,
    value,
    color: piePalette[i % piePalette.length]!,
  }))
}

/** Comparativo inicial × atual por item (campos numéricos de `IDonation`). */
export type DonationQtyCompareRow = { item: string; inicial: number; atual: number }

export function donationInitialVsCurrent(donations: IDonation[]): DonationQtyCompareRow[] {
  return donations.map((d) => ({
    item: d.name.length > 14 ? `${d.name.slice(0, 12)}…` : d.name,
    inicial: d.initial_quantity,
    atual: d.current_quantity,
  }))
}
