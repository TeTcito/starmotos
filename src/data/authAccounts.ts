import { UserRole } from '../types/customer';

export interface CorporateAccount {
  email: string;
  role: UserRole;
  passwords: string[];
  workshopId?: string;
  name: string;
}

export const OFFICIAL_CORPORATE_ACCOUNTS: Record<string, CorporateAccount> = {
  // 1. Matriz Central (Administrador)
  'admin@starmotos.com': {
    email: 'admin@starmotos.com',
    role: 'admin',
    passwords: ['StarMotos@Admin2026', 'StarMotos@2026'],
    workshopId: 'matriz-la-mana',
    name: 'Administración Matriz Central',
  },
  'admin@starmotos.ec': {
    email: 'admin@starmotos.ec',
    role: 'admin',
    passwords: ['StarMotos@Admin2026', 'StarMotos@2026'],
    workshopId: 'matriz-la-mana',
    name: 'Administración Matriz Central',
  },
  'starsmotor17@gmail.com': {
    email: 'starsmotor17@gmail.com',
    role: 'admin',
    passwords: ['StarMotos@Admin2026', 'StarMotos@2026'],
    workshopId: 'matriz-la-mana',
    name: 'Administración Matriz Central (Google)',
  },

  // 2. Garante de Marca Oficial
  'garante@starmotos.com': {
    email: 'garante@starmotos.com',
    role: 'garante',
    passwords: ['StarMotos@Garante2026', 'StarMotos@2026'],
    name: 'Garantías Oficial Benelli & Marcas',
  },
  'garante@starmotos.ec': {
    email: 'garante@starmotos.ec',
    role: 'garante',
    passwords: ['StarMotos@Garante2026', 'StarMotos@2026'],
    name: 'Garantías Oficial StarMotos',
  },
  'garantias.oficial@benelli-ecuador.com': {
    email: 'garantias.oficial@benelli-ecuador.com',
    role: 'garante',
    passwords: ['StarMotos@Garante2026', 'StarMotos@2026'],
    name: 'Garantías Oficial Benelli Ecuador',
  },

  // 3. Talleres y Sedes Oficiales (11 Ubicaciones de la Red Oficial)
  'sede.la-mana@starmotos.com': {
    email: 'sede.la-mana@starmotos.com',
    role: 'taller',
    workshopId: 'matriz-la-mana',
    passwords: ['TallerLaMana@2026', 'StarMotos@2026'],
    name: 'StarMotos Matriz La Maná',
  },
  'sede.quevedo@starmotos.com': {
    email: 'sede.quevedo@starmotos.com',
    role: 'taller',
    workshopId: 'taller-quevedo',
    passwords: ['TallerQuevedo@2026', 'StarMotos@2026'],
    name: 'StarMotos Sucursal Quevedo',
  },
  'sede.buena-fe@starmotos.com': {
    email: 'sede.buena-fe@starmotos.com',
    role: 'taller',
    workshopId: 'taller-buena-fe',
    passwords: ['TallerBuenaFe@2026', 'StarMotos@2026'],
    name: 'StarMotos Sucursal Buena Fe',
  },
  'sede.balzar@starmotos.com': {
    email: 'sede.balzar@starmotos.com',
    role: 'taller',
    workshopId: 'taller-balzar',
    passwords: ['TallerBalzar@2026', 'StarMotos@2026'],
    name: 'StarMotos Sucursal Balzar',
  },
  'sede.el-carmen@starmotos.com': {
    email: 'sede.el-carmen@starmotos.com',
    role: 'taller',
    workshopId: 'taller-el-carmen',
    passwords: ['TallerElCarmen@2026', 'StarMotos@2026'],
    name: 'StarMotos Sucursal El Carmen',
  },
  'sede.moraspungo@starmotos.com': {
    email: 'sede.moraspungo@starmotos.com',
    role: 'taller',
    workshopId: 'taller-moraspungo',
    passwords: ['TallerMoraspungo@2026', 'StarMotos@2026'],
    name: 'StarMotos Sucursal Moraspungo',
  },
  'sede.mocache@starmotos.com': {
    email: 'sede.mocache@starmotos.com',
    role: 'taller',
    workshopId: 'taller-mocache',
    passwords: ['TallerMocache@2026', 'StarMotos@2026'],
    name: 'StarMotos Sucursal Mocache',
  },
  'sede.quinzaloma@starmotos.com': {
    email: 'sede.quinzaloma@starmotos.com',
    role: 'taller',
    workshopId: 'taller-quinzaloma',
    passwords: ['TallerQuinzaloma@2026', 'StarMotos@2026'],
    name: 'StarMotos Sucursal Quinzaloma',
  },
  'sede.portoviejo@starmotos.com': {
    email: 'sede.portoviejo@starmotos.com',
    role: 'taller',
    workshopId: 'taller-portoviejo',
    passwords: ['TallerPortoviejo@2026', 'StarMotos@2026'],
    name: 'StarMotos Sucursal Portoviejo',
  },
  'sede.ricaurte@starmotos.com': {
    email: 'sede.ricaurte@starmotos.com',
    role: 'taller',
    workshopId: 'taller-ricaurte',
    passwords: ['TallerRicaurte@2026', 'StarMotos@2026'],
    name: 'StarMotos Sucursal Ricaurte',
  },
  'sede.el-empalme@starmotos.com': {
    email: 'sede.el-empalme@starmotos.com',
    role: 'taller',
    workshopId: 'taller-el-empalme',
    passwords: ['TallerElEmpalme@2026', 'StarMotos@2026'],
    name: 'StarMotos Sucursal El Empalme',
  },
};
