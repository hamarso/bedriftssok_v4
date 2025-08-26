export interface SearchFilters {
  naceCodes: string[];
  postnummer: string;
  kommunenummer: string;
  enhetType: 'hovedenhet' | 'underenhet';
}

export interface BRREGEnhet {
  organisasjonsnummer: string;
  navn: string;
  postadresse: string;
  postnummer: string;
  kommunenummer: string;
  antallAnsatte: number;
  naceKode: string;
  naceBeskrivelse: string;
  organisasjonsform: string;
  registreringsdato: string;
  status: string;
  telefon?: string;
}

export interface BRREGResponse {
  _embedded: {
    enheter: BRREGEnhet[];
  };
  _links: {
    self: { href: string };
    next?: { href: string };
    last?: { href: string };
  };
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface SearchResult {
  data: BRREGEnhet[];
  totalCount: number;
  hasMore: boolean;
}
