# Bedriftssøk App

En Next.js applikasjon for å søke etter bedrifter i BRREG Enhetsregisteret.

## Funksjonalitet

- **Søkefiltre**: NACE-koder, postnummer, kommunenummer, enhetstype
- **BRREG API integrasjon**: Henter data fra BRREG Åpne data API
- **Paginering**: Støtter opptil 10 000 resultater
- **Eksport**: CSV og Excel eksport med papaparse og xlsx
- **Responsivt design**: Moderne UI med Tailwind CSS og shadcn/ui

## Teknisk stack

- Next.js 14 med App Router
- TypeScript
- Tailwind CSS
- shadcn/ui komponenter
- Radix UI primitiver

## Installasjon

1. Installer avhengigheter:
```bash
npm install
```

2. Start utviklingsserver:
```bash
npm run dev
```

3. Åpne [http://localhost:3000](http://localhost:3000) i nettleseren

## Bygging for produksjon

```bash
npm run build
npm start
```

## Deployment på Vercel

Applikasjonen er klar for deployment på Vercel:

1. Push koden til GitHub
2. Koble til Vercel
3. Deploy automatisk

## API endpoints

- `POST /api/search` - Søk i BRREG API med filtre

## Struktur

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── globals.css     # Global CSS med Tailwind
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Hovedsiden
├── components/          # React komponenter
│   ├── ui/             # UI komponenter (shadcn/ui)
│   ├── SearchForm.tsx  # Søkeform
│   └── ResultsTable.tsx # Resultattabell
└── lib/                # Utility funksjoner
    ├── types.ts        # TypeScript typer
    ├── utils.ts        # Utility funksjoner
    └── export.ts       # Eksport funksjoner
```

## Lisens

ISC
