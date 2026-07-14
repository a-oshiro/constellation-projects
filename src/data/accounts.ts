// ── Shared account data — used by the Accounts table and Account Settings pages ─

export type DataSource = 'MarketCheck' | 'JDP';

export interface AccountUser {
  id: string;
  name: string;
  initials: string;
}

export interface Account {
  id: string;
  name: string;
  brand: string;
  dataSource: DataSource;
  disclosureTemplate: string | null;
  disclosureUrl: string;
  users: AccountUser[];
}

// ── Mock users — pool shared across accounts ───────────────────────────────────

const TEAM: Record<string, AccountUser> = {
  u1: { id: 'u1', name: 'Olivia Park', initials: 'OP' },
  u2: { id: 'u2', name: 'Ethan Cole', initials: 'EC' },
  u3: { id: 'u3', name: 'Maria Chen', initials: 'MC' },
  u4: { id: 'u4', name: 'Jacob Reyes', initials: 'JR' },
  u5: { id: 'u5', name: 'Sofia Tran', initials: 'ST' },
  u6: { id: 'u6', name: 'Daniel Kim', initials: 'DK' },
  u7: { id: 'u7', name: 'Ava Brooks', initials: 'AB' },
  u8: { id: 'u8', name: 'Noah Patel', initials: 'NP' },
  u9: { id: 'u9', name: 'Grace Liu', initials: 'GL' },
  u10: { id: 'u10', name: 'Liam Osei', initials: 'LO' },
  u11: { id: 'u11', name: 'Zoe Farrell', initials: 'ZF' },
  u12: { id: 'u12', name: 'Mason Diaz', initials: 'MD' },
};

const users = (...ids: (keyof typeof TEAM)[]) => ids.map((id) => TEAM[id]);

// ── Mock accounts — dealerships across suburban US cities, mixed brands ────────

export const ACCOUNTS: Account[] = [
  { id: 'acc-1', name: 'BMW of Manhattan', brand: 'BMW', dataSource: 'MarketCheck', disclosureTemplate: 'BMWManhattan_2025', disclosureUrl: 'www.bmwmanhattan.com/', users: users('u1', 'u2', 'u3', 'u4', 'u5', 'u6') },
  { id: 'acc-2', name: 'BMW of Seattle', brand: 'BMW', dataSource: 'JDP', disclosureTemplate: 'BMWSeattle_Disclosure', disclosureUrl: 'www.bmwseattle.com/', users: users('u7', 'u8', 'u9') },
  { id: 'acc-3', name: 'Mercedes-Benz of Naperville', brand: 'Mercedes-Benz', dataSource: 'MarketCheck', disclosureTemplate: 'MBNaperville_2025', disclosureUrl: 'www.mbnaperville.com/', users: users('u2', 'u5') },
  { id: 'acc-4', name: 'Audi Cherry Hill', brand: 'Audi', dataSource: 'JDP', disclosureTemplate: null, disclosureUrl: 'www.audicherryhill.com/', users: users('u1', 'u3', 'u6', 'u9') },
  { id: 'acc-5', name: 'Lexus of Bloomington', brand: 'Lexus', dataSource: 'MarketCheck', disclosureTemplate: 'LexusBloomington_Disclosure', disclosureUrl: 'www.lexusbloomington.com/', users: users('u4') },
  { id: 'acc-6', name: 'Toyota of Plano', brand: 'Toyota', dataSource: 'JDP', disclosureTemplate: 'ToyotaPlano_2026', disclosureUrl: 'www.toyotaplano.com/', users: users('u1', 'u2', 'u3', 'u4', 'u5') },
  { id: 'acc-7', name: 'Honda of Roswell', brand: 'Honda', dataSource: 'MarketCheck', disclosureTemplate: null, disclosureUrl: 'www.hondaroswell.com/', users: users('u6', 'u7', 'u8') },
  { id: 'acc-8', name: 'Ford of Overland Park', brand: 'Ford', dataSource: 'JDP', disclosureTemplate: 'FordOverlandPark_Disclosure', disclosureUrl: 'www.fordoverlandpark.com/', users: users('u9', 'u10') },
  { id: 'acc-9', name: 'Chevrolet of Chesterfield', brand: 'Chevrolet', dataSource: 'MarketCheck', disclosureTemplate: 'ChevyChesterfield_2025', disclosureUrl: 'www.chevychesterfield.com/', users: users('u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7') },
  { id: 'acc-10', name: 'Volkswagen of Schaumburg', brand: 'Volkswagen', dataSource: 'JDP', disclosureTemplate: null, disclosureUrl: 'www.vwschaumburg.com/', users: users('u11') },
  { id: 'acc-11', name: 'Kia of Fishers', brand: 'Kia', dataSource: 'MarketCheck', disclosureTemplate: 'KiaFishers_Disclosure', disclosureUrl: 'www.kiafishers.com/', users: users('u2', 'u4', 'u6', 'u8') },
  { id: 'acc-12', name: 'Hyundai of Westminster', brand: 'Hyundai', dataSource: 'JDP', disclosureTemplate: 'HyundaiWestminster_2025', disclosureUrl: 'www.hyundaiwestminster.com/', users: users('u5', 'u9') },
  { id: 'acc-13', name: 'Subaru of Cary', brand: 'Subaru', dataSource: 'MarketCheck', disclosureTemplate: null, disclosureUrl: 'www.subarucary.com/', users: users('u1', 'u3', 'u5', 'u7', 'u9', 'u11') },
  { id: 'acc-14', name: 'Mazda of Gilbert', brand: 'Mazda', dataSource: 'JDP', disclosureTemplate: 'MazdaGilbert_Disclosure', disclosureUrl: 'www.mazdagilbert.com/', users: users('u2', 'u6', 'u10') },
  { id: 'acc-15', name: 'Nissan of Franklin', brand: 'Nissan', dataSource: 'MarketCheck', disclosureTemplate: 'NissanFranklin_2026', disclosureUrl: 'www.nissanfranklin.com/', users: users('u12') },
  { id: 'acc-16', name: 'Jeep of Round Rock', brand: 'Jeep', dataSource: 'JDP', disclosureTemplate: null, disclosureUrl: 'www.jeeproundrock.com/', users: users('u3', 'u5', 'u7', 'u9') },
  { id: 'acc-17', name: 'GMC of Sugar Land', brand: 'GMC', dataSource: 'MarketCheck', disclosureTemplate: 'GMCSugarLand_Disclosure', disclosureUrl: 'www.gmcsugarland.com/', users: users('u4', 'u8') },
  { id: 'acc-18', name: 'Cadillac of Brentwood', brand: 'Cadillac', dataSource: 'JDP', disclosureTemplate: 'CadillacBrentwood_2025', disclosureUrl: 'www.cadillacbrentwood.com/', users: users('u1', 'u2', 'u3', 'u4', 'u5') },
  { id: 'acc-19', name: 'Acura of Woodbury', brand: 'Acura', dataSource: 'MarketCheck', disclosureTemplate: null, disclosureUrl: 'www.acurawoodbury.com/', users: users('u6', 'u10', 'u12') },
  { id: 'acc-20', name: 'Infiniti of Norman', brand: 'Infiniti', dataSource: 'JDP', disclosureTemplate: 'InfinitiNorman_Disclosure', disclosureUrl: 'www.infinitinorman.com/', users: users('u7') },
  { id: 'acc-21', name: 'Volvo of Frisco', brand: 'Volvo', dataSource: 'MarketCheck', disclosureTemplate: 'VolvoFrisco_2026', disclosureUrl: 'www.volvofrisco.com/', users: users('u2', 'u4', 'u6', 'u9') },
  { id: 'acc-22', name: 'Porsche Alpharetta', brand: 'Porsche', dataSource: 'JDP', disclosureTemplate: null, disclosureUrl: 'www.porschealpharetta.com/', users: users('u3', 'u11') },
  { id: 'acc-23', name: 'Land Rover of Troy', brand: 'Land Rover', dataSource: 'MarketCheck', disclosureTemplate: 'LandRoverTroy_Disclosure', disclosureUrl: 'www.landrovertroy.com/', users: users('u1', 'u4', 'u6', 'u8', 'u10', 'u12') },
  { id: 'acc-24', name: 'MINI of Sandy Springs', brand: 'MINI', dataSource: 'JDP', disclosureTemplate: 'MiniSandySprings_2025', disclosureUrl: 'www.minisandysprings.com/', users: users('u5', 'u7', 'u9') },
];

export const getAccountById = (id: string) => ACCOUNTS.find((a) => a.id === id);

// ── Shared color-hash helper for logo placeholders and avatars ─────────────────

const COLOR_PALETTE = ['#1565C0', '#B71C1C', '#BF360C', '#1A237E', '#1B5E20', '#4A148C', '#E65100', '#006064', '#37474F', '#880E4F'];

export function accountColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % COLOR_PALETTE.length;
  return COLOR_PALETTE[h];
}
