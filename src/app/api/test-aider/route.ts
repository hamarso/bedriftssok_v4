import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST AIDER SEARCH ===')
    
    // Test 1: Search by NACE code 69.201
    console.log('Testing NACE code 69.201 search...')
    const naceResponse = await fetch('https://data.brreg.no/enhetsregisteret/api/enheter?naeringskode=69.201&size=100')
    const naceData = await naceResponse.json()
    
    const naceCompanies = naceData._embedded?.enheter || []
    console.log(`Found ${naceCompanies.length} companies with NACE 69.201`)
    
    // Check for Aider in NACE results
    const aiderInNace = naceCompanies.find((company: any) => {
      const name = company.navn?.navn || company.navn || ''
      return name.toLowerCase().includes('aider')
    })
    
    if (aiderInNace) {
      console.log('✅ Found Aider in NACE 69.201 results:', aiderInNace.navn?.navn || aiderInNace.navn)
    } else {
      console.log('❌ Aider not found in NACE 69.201 results')
    }
    
    // Test 2: Search by company name "Aider"
    console.log('Testing direct name search for Aider...')
    const nameResponse = await fetch('https://data.brreg.no/enhetsregisteret/api/enheter?navn=Aider&size=50')
    const nameData = await nameResponse.json()
    
    const nameCompanies = nameData._embedded?.enheter || []
    console.log(`Found ${nameCompanies.length} companies with name containing "Aider"`)
    
    // Show all Aider results
    nameCompanies.forEach((company: any, index: number) => {
      const name = company.navn?.navn || company.navn || ''
      const nace = company.naeringskode1?.kode || 'No NACE'
      console.log(`${index + 1}. ${name} (${company.organisasjonsnummer}) - NACE: ${nace}`)
    })
    
    // Test 3: Search for companies with "Aider" in name and NACE 69.201
    const aiderWithNace = nameCompanies.find((company: any) => {
      const nace = company.naeringskode1?.kode || ''
      return nace === '69.201'
    })
    
    if (aiderWithNace) {
      console.log('✅ Found Aider with NACE 69.201:', aiderWithNace.navn?.navn || aiderWithNace.navn)
    } else {
      console.log('❌ No Aider company found with NACE 69.201')
    }
    
    return NextResponse.json({
      naceResults: naceCompanies.length,
      nameResults: nameCompanies.length,
      aiderInNace: !!aiderInNace,
      aiderWithNace: !!aiderWithNace,
      allAiderCompanies: nameCompanies.map((company: any) => ({
        name: company.navn?.navn || company.navn,
        orgNumber: company.organisasjonsnummer,
        nace: company.naeringskode1?.kode
      }))
    })
    
  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
