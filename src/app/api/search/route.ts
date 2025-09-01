import { NextRequest, NextResponse } from 'next/server'
import { SearchFilters, BRREGResponse, BRREGEnhet, SearchResult } from '@/lib/types'

const BRREG_BASE_URL = 'https://data.brreg.no/enhetsregisteret/api/enheter'

async function fetchBRREGData(filters: SearchFilters): Promise<BRREGEnhet[]> {
  const selskaper: BRREGEnhet[] = []
  
  // If multiple NACE codes are specified, search for each one and combine results
  if (filters.naceCodes.length > 1) {
    console.log(`Searching for multiple NACE codes: ${filters.naceCodes.join(', ')}`)
    
    for (const naceCode of filters.naceCodes) {
      console.log(`Fetching data for NACE code: ${naceCode}`)
      const results = await fetchBRREGDataForNACE(naceCode, filters)
      selskaper.push(...results)
    }
    
    // Remove duplicates based on organization number
    const uniqueSelskaper = selskaper.filter((selskap, index, self) => 
      index === self.findIndex(s => s.organisasjonsnummer === selskap.organisasjonsnummer)
    )
    
    console.log(`Total unique companies found: ${uniqueSelskaper.length}`)
    return uniqueSelskaper
  } else {
    // Single NACE code or no NACE code specified
    const naceCode = filters.naceCodes.length > 0 ? filters.naceCodes[0] : null
    return await fetchBRREGDataForNACE(naceCode, filters)
  }
}

async function fetchBRREGDataForNACE(naceCode: string | null, filters: SearchFilters): Promise<BRREGEnhet[]> {
  const selskaper: BRREGEnhet[] = []
  const params = new URLSearchParams()
  
  // Add NACE code filter if specified
  if (naceCode) {
    params.append('naeringskode', naceCode)
    console.log(`Filtering by NACE code: ${naceCode}`)
  }
  
  // Add minimum employee count filter
  if (filters.minAnsatte && filters.minAnsatte > 0) {
    params.append('fraAntallAnsatte', filters.minAnsatte.toString())
  }
  
  // Add other filters
  if (filters.postnummer && filters.postnummer.trim()) {
    params.append('postnummer', filters.postnummer.trim())
  }
  
  if (filters.kommunenummer && filters.kommunenummer.trim()) {
    params.append('kommunenummer', filters.kommunenummer.trim())
  }
  
  // Add enhet type
  if (filters.enhetType === 'underenhet') {
    params.append('type', 'UNDERENHET')
  }
  
  // Set page size to maximum to reduce number of requests
  params.append('size', '1000')
  
  let page = 0
  let totalPages = 0
  
  while (true) {
    // Add page parameter
    params.set('page', page.toString())
    
    const url = `${BRREG_BASE_URL}?${params.toString()}`
    console.log(`Fetching page ${page}:`, url)
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (!response.ok) {
        console.error(`BRREG API error ${response.status}: ${response.statusText}`)
        break
      }
      
      const data: BRREGResponse = await response.json()
      
      if (data._embedded && data._embedded.enheter) {
        const transformedData = transformBRREGData(data)
        selskaper.push(...transformedData)
        
        // Log pagination info
        if (page === 0 && data.page) {
          totalPages = data.page.totalPages
          console.log(`Total pages: ${totalPages}, Total elements: ${data.page.totalElements}`)
        }
        
        // Check if there are more pages
        if (data._links && data._links.next && page < totalPages - 1) {
          page++
        } else {
          break
        }
      } else {
        console.log('No more data available')
        break
      }
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error)
      break
    }
  }
  
  console.log(`Fetched ${selskaper.length} companies for NACE code ${naceCode || 'all'}`)
  return selskaper
}

function transformBRREGData(brregData: BRREGResponse): BRREGEnhet[] {
  if (!brregData._embedded?.enheter) {
    return []
  }
  
  return brregData._embedded.enheter.map((enhet: any) => {
    // Log all available fields for the first enhet to see what we're missing
    if (enhet.organisasjonsnummer === brregData._embedded.enheter[0].organisasjonsnummer) {
      console.log('=== FULL ENHET RESPONSE ===')
      console.log('All available fields:', Object.keys(enhet))
      console.log('Full enhet object:', JSON.stringify(enhet, null, 2))
      console.log('=== END FULL RESPONSE ===')
    }
    
    // Improved name extraction - handle different field structures
    let companyName = ''
    if (typeof enhet.navn === 'string') {
      companyName = enhet.navn
    } else if (enhet.navn && typeof enhet.navn === 'object' && enhet.navn.navn) {
      companyName = enhet.navn.navn
    } else if (enhet.navn && typeof enhet.navn === 'object' && enhet.navn.beskrivelse) {
      companyName = enhet.navn.beskrivelse
    }
    
    // Fallback to other possible name fields
    if (!companyName) {
      companyName = enhet.navn || enhet.beskrivelse || 'Ukjent navn'
    }
    
    return {
      organisasjonsnummer: enhet.organisasjonsnummer || '',
      navn: companyName,
      postadresse: enhet.forretningsadresse?.poststed || enhet.postadresse?.adresse?.[0] || '',
      postnummer: enhet.postadresse?.postnummer || '',
      kommunenummer: enhet.postadresse?.kommunenummer || '',
      antallAnsatte: enhet.antallAnsatte || 0,
      naceKode: enhet.naeringskode1?.kode || '',
      naceBeskrivelse: enhet.naeringskode1?.beskrivelse || '',
      organisasjonsform: enhet.organisasjonsform?.kode || '',
      registreringsdato: enhet.registreringsdatoEnhetsregisteret || enhet.registreringsdato || '',
      status: enhet.konkurs ? 'KONKURS' : enhet.underAvvikling ? 'AVVIKLING' : 'AKTIV',
      telefon: enhet.mobil || enhet.epostadresse ? 'Kontaktinfo tilgjengelig' : undefined,
      mobil: enhet.mobil || '',
      epost: enhet.epostadresse || ''
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const filters: SearchFilters = body.filters
    
    console.log('=== SEARCH REQUEST START ===')
    console.log('Search filters received:', JSON.stringify(filters, null, 2))
    
    // Fetch all data with filters
    const allResults = await fetchBRREGData(filters)
    
    console.log(`Found ${allResults.length} total results`)
    
    // Log some sample results for debugging
    if (allResults.length > 0) {
      console.log('Sample results:')
      allResults.slice(0, 5).forEach((result, index) => {
        console.log(`${index + 1}. ${result.navn} (${result.organisasjonsnummer}) - NACE: ${result.naceKode}`)
      })
    }
    
    // Check if specific company was found (for debugging)
    const aiderFound = allResults.find(company => 
      company.navn.toLowerCase().includes('aider') || 
      company.organisasjonsnummer.includes('aider')
    )
    if (aiderFound) {
      console.log('Found Aider:', aiderFound)
    } else {
      console.log('Aider not found in results')
    }
    
    const result: SearchResult = {
      data: allResults,
      totalCount: allResults.length,
      hasMore: false
    }
    
    console.log(`Final result: ${result.data.length} items`)
    console.log('=== SEARCH REQUEST END ===')
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('=== SEARCH API ERROR ===')
    console.error('Error details:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to search BRREG API', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
