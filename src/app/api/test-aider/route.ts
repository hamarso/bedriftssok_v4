import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST AIDER SEARCH ===')
    
    // Test 1: Search by NACE code 69.201 (Revisjon)
    console.log('Testing NACE code 69.201 (Revisjon)...')
    const nace201Response = await fetch('https://data.brreg.no/enhetsregisteret/api/enheter?naeringskode=69.201&size=100')
    const nace201Data = await nace201Response.json()
    
    const nace201Companies = nace201Data._embedded?.enheter || []
    console.log(`Found ${nace201Companies.length} companies with NACE 69.201`)
    
    // Test 2: Search by NACE code 69.202 (Regnskapsføring og bokføring)
    console.log('Testing NACE code 69.202 (Regnskapsføring og bokføring)...')
    const nace202Response = await fetch('https://data.brreg.no/enhetsregisteret/api/enheter?naeringskode=69.202&size=100')
    const nace202Data = await nace202Response.json()
    
    const nace202Companies = nace202Data._embedded?.enheter || []
    console.log(`Found ${nace202Companies.length} companies with NACE 69.202`)
    
    // Check for Aider in both NACE results
    const aiderInNace201 = nace201Companies.find((company: any) => {
      const name = company.navn?.navn || company.navn || ''
      return name.toLowerCase().includes('aider')
    })
    
    const aiderInNace202 = nace202Companies.find((company: any) => {
      const name = company.navn?.navn || company.navn || ''
      return name.toLowerCase().includes('aider')
    })
    
    if (aiderInNace201) {
      console.log('✅ Found Aider in NACE 69.201 results:', aiderInNace201.navn?.navn || aiderInNace201.navn)
    } else {
      console.log('❌ Aider not found in NACE 69.201 results')
    }
    
    if (aiderInNace202) {
      console.log('✅ Found Aider in NACE 69.202 results:', aiderInNace202.navn?.navn || aiderInNace202.navn)
    } else {
      console.log('❌ Aider not found in NACE 69.202 results')
    }
    
    // Test 3: Search by company name "Aider"
    console.log('Testing direct name search for Aider...')
    const nameResponse = await fetch('https://data.brreg.no/enhetsregisteret/api/enheter?navn=Aider&size=50')
    const nameData = await nameResponse.json()
    
    const nameCompanies = nameData._embedded?.enheter || []
    console.log(`Found ${nameCompanies.length} companies with name containing "Aider"`)
    
    // Show all Aider results with their NACE codes
    nameCompanies.forEach((company: any, index: number) => {
      const name = company.navn?.navn || company.navn || ''
      const nace = company.naeringskode1?.kode || 'No NACE'
      console.log(`${index + 1}. ${name} (${company.organisasjonsnummer}) - NACE: ${nace}`)
    })
    
    return NextResponse.json({
      nace201Results: nace201Companies.length,
      nace202Results: nace202Companies.length,
      nameResults: nameCompanies.length,
      aiderInNace201: !!aiderInNace201,
      aiderInNace202: !!aiderInNace202,
      allAiderCompanies: nameCompanies.map((company: any) => ({
        name: company.navn?.navn || company.navn,
        orgNumber: company.organisasjonsnummer,
        nace: company.naeringskode1?.kode
      }))
    })
    
  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
