import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyName, orgNumber } = body
    let { website } = body
    
    console.log('=== SCRAPING REQUEST START ===')
    console.log('Company:', companyName)
    console.log('Website:', website)
    console.log('Org number:', orgNumber)
    
    let phoneNumber = null
    let source = null
    
    // Strategy 1: Try to find website from company name if not provided
    if (!website && companyName) {
      const potentialWebsite = await findCompanyWebsite(companyName, orgNumber)
      if (potentialWebsite) {
        website = potentialWebsite
        source = 'Found via search'
      }
    }
    
    // Strategy 2: Scrape phone from website if available
    if (website) {
      try {
        phoneNumber = await scrapePhoneFromWebsite(website)
        source = website
      } catch (error) {
        console.log('Failed to scrape website:', error)
      }
    }
    
    // Strategy 3: Try Google search for company phone number (most reliable external source)
    if (!phoneNumber && companyName) {
      try {
        phoneNumber = await searchGoogleForPhone(companyName, orgNumber)
        if (phoneNumber) {
          source = 'Google Search'
        }
      } catch (error) {
        console.log('Failed to search Google:', error)
      }
    }
    
    // Strategy 4: Try Gule Sider search (often blocked, but worth trying)
    if (!phoneNumber && companyName) {
      try {
        phoneNumber = await searchGuleSider(companyName, orgNumber)
        source = 'Gule Sider'
      } catch (error) {
        console.log('Failed to search Gule Sider:', error)
      }
    }
    
    // Strategy 5: Try to find phone from company website contact page
    if (!phoneNumber && website) {
      try {
        phoneNumber = await searchContactPage(website)
        if (phoneNumber) {
          source = 'Contact Page'
        }
      } catch (error) {
        console.log('Failed to search contact page:', error)
      }
    }
    
    console.log('=== SCRAPING RESULT ===')
    console.log('Phone number found:', phoneNumber)
    console.log('Source:', source)
    
    return NextResponse.json({
      success: true,
      phoneNumber,
      source,
      companyName,
      orgNumber
    })
    
  } catch (error) {
    console.error('=== SCRAPING API ERROR ===')
    console.error('Error details:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to scrape phone number', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

async function findCompanyWebsite(companyName: string, orgNumber: string): Promise<string | null> {
  try {
    // Try to construct a common website pattern
    const cleanName = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/as$/, '')
      .replace(/ab$/, '')
      .replace(/aps$/, '')
    
    const potentialDomains = [
      `${cleanName}.no`,
      `${cleanName}.com`,
      `www.${cleanName}.no`,
      `www.${cleanName}.com`
    ]
    
    // Test if any of these domains exist
    for (const domain of potentialDomains) {
      try {
        const response = await fetch(`https://${domain}`, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
        if (response.ok) {
          return `https://${domain}`
        }
      } catch (error) {
        // Continue to next domain
      }
    }
    
    return null
  } catch (error) {
    console.log('Error finding website:', error)
    return null
  }
}

async function scrapePhoneFromWebsite(website: string): Promise<string | null> {
  try {
    console.log('Scraping website:', website)
    
    const response = await fetch(website, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const html = await response.text()
    
    // Priority 1: Look for main office/switchboard numbers first
    const mainOfficePatterns = [
      /(?:\+47|0047)?\s*[2-3]\d{7}/g,  // Norwegian landline numbers (2xxxxxxx, 3xxxxxxx)
      /(?:\+47|0047)?\s*[8]\d{7}/g,    // Norwegian special numbers (8xxxxxxx)
      /tel:([^"'\s]+)/gi,               // tel: links (often main numbers)
      /phone["\s:]+([^"'\s]+)/gi,       // phone labels
      /telefon["\s:]+([^"'\s]+)/gi,     // telefon labels (Norwegian)
      /hovedkontor["\s:]+([^"'\s]+)/gi, // hovedkontor labels
      /kontor["\s:]+([^"'\s]+)/gi,      // kontor labels
      /sentralbord["\s:]+([^"'\s]+)/gi, // sentralbord labels
      /reception["\s:]+([^"'\s]+)/gi,   // reception labels
      /kundeservice["\s:]+([^"'\s]+)/gi // kundeservice labels
    ]
    
    // Priority 2: Look for mobile numbers as fallback
    const mobilePatterns = [
      /(?:\+47|0047)?\s*[49]\d{7}/g,   // Norwegian mobile numbers (4xxxxxxx, 9xxxxxxx)
    ]
    
    // Try main office patterns first
    for (const pattern of mainOfficePatterns) {
      const matches = html.match(pattern)
      if (matches && matches.length > 0) {
        // Clean up the phone number
        let phone = matches[0]
        if (phone.startsWith('tel:')) {
          phone = phone.substring(4)
        }
        phone = phone.replace(/[^\d+]/g, '') // Keep only digits and +
        
        if (phone.length >= 8) {
          console.log('Found main office phone number:', phone)
          return phone
        }
      }
    }
    
    // If no main office number found, try mobile numbers
    for (const pattern of mobilePatterns) {
      const matches = html.match(pattern)
      if (matches && matches.length > 0) {
        let phone = matches[0]
        phone = phone.replace(/[^\d+]/g, '')
        
        if (phone.length >= 8) {
          console.log('Found mobile phone number (fallback):', phone)
          return phone
        }
      }
    }
    
    return null
  } catch (error) {
    console.log('Error scraping website:', error)
    return null
  }
}

async function searchGuleSider(companyName: string, orgNumber: string): Promise<string | null> {
  try {
    console.log('Searching Gule Sider for:', companyName)
    
    // Construct Gule Sider search URL
    const searchQuery = encodeURIComponent(companyName)
    const searchUrl = `https://www.gulesider.no/resultat?q=${searchQuery}`
    
    // More realistic headers to avoid bot detection
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'nb-NO,nb;q=0.9,no;q=0.8,en-US;q=0.7,en;q=0.6',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    }
    
    // Add a small delay to avoid being flagged as a bot
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    const response = await fetch(searchUrl, {
      headers,
      signal: AbortSignal.timeout(15000) // Increased timeout
    })
    
    if (!response.ok) {
      if (response.status === 403) {
        console.log('Gule Sider blocked the request (403 Forbidden) - likely bot detection')
        // Try alternative approach - search with org number instead
        return await searchGuleSiderAlternative(orgNumber)
      }
      throw new Error(`HTTP ${response.status}`)
    }
    
    const html = await response.text()
    
    // Priority 1: Look for main office numbers first (landline)
    const mainOfficePattern = /(?:\+47|0047)?\s*[2-3]\d{7}/g
    const mainOfficeMatches = html.match(mainOfficePattern)
    
    if (mainOfficeMatches && mainOfficeMatches.length > 0) {
      const phone = mainOfficeMatches[0].replace(/[^\d+]/g, '')
      console.log('Found main office phone in Gule Sider:', phone)
      return phone
    }
    
    // Priority 2: Look for special numbers (8xxxxxxx)
    const specialPattern = /(?:\+47|0047)?\s*[8]\d{7}/g
    const specialMatches = html.match(specialPattern)
    
    if (specialMatches && specialMatches.length > 0) {
      const phone = specialMatches[0].replace(/[^\d+]/g, '')
      console.log('Found special phone in Gule Sider:', phone)
      return phone
    }
    
    // Priority 3: Look for mobile numbers as last resort
    const mobilePattern = /(?:\+47|0047)?\s*[49]\d{7}/g
    const mobileMatches = html.match(mobilePattern)
    
    if (mobileMatches && mobileMatches.length > 0) {
      const phone = mobileMatches[0].replace(/[^\d+]/g, '')
      console.log('Found mobile phone in Gule Sider (fallback):', phone)
      return phone
    }
    
    return null
  } catch (error) {
    console.log('Error searching Gule Sider:', error)
    // Try alternative approach if main search fails
    try {
      return await searchGuleSiderAlternative(orgNumber)
    } catch (altError) {
      console.log('Alternative Gule Sider search also failed:', altError)
      return null
    }
  }
}

// Alternative approach: search by organization number instead of company name
async function searchGuleSiderAlternative(orgNumber: string): Promise<string | null> {
  try {
    console.log('Trying alternative Gule Sider search with org number:', orgNumber)
    
    // Search by organization number instead
    const searchUrl = `https://www.gulesider.no/resultat?q=${orgNumber}`
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'nb-NO,nb;q=0.9,no;q=0.8,en-US;q=0.7,en;q=0.6',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }
    
    // Longer delay for alternative search
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
    
    const response = await fetch(searchUrl, {
      headers,
      signal: AbortSignal.timeout(15000)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const html = await response.text()
    
    // Look for phone numbers in the results
    const phonePattern = /(?:\+47|0047)?\s*[2-3]\d{7}|(?:\+47|0047)?\s*[8]\d{7}|(?:\+47|0047)?\s*[49]\d{7}/g
    const matches = html.match(phonePattern)
    
    if (matches && matches.length > 0) {
      const phone = matches[0].replace(/[^\d+]/g, '')
      console.log('Found phone in alternative Gule Sider search:', phone)
      return phone
    }
    
    return null
  } catch (error) {
    console.log('Alternative Gule Sider search failed:', error)
    return null
  }
}

async function searchContactPage(website: string): Promise<string | null> {
  try {
    console.log('Searching contact page for phone:', website)
    
    // Try common contact page URLs
    const contactUrls = [
      `${website}/kontakt`,
      `${website}/contact`,
      `${website}/om-oss`,
      `${website}/about`,
      `${website}/kontaktinfo`,
      `${website}/contact-info`
    ]
    
    for (const contactUrl of contactUrls) {
      try {
        const response = await fetch(contactUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          signal: AbortSignal.timeout(8000)
        })
        
        if (!response.ok) {
          continue
        }
        
        const html = await response.text()
        
        // Look for phone numbers in the contact page
        const phonePatterns = [
          /(?:\+47|0047)?\s*[2-3]\d{7}/g,  // Norwegian landline numbers
          /(?:\+47|0047)?\s*[8]\d{7}/g,    // Norwegian special numbers
          /(?:\+47|0047)?\s*[49]\d{7}/g,   // Norwegian mobile numbers
          /tel:([^"'\s]+)/gi,               // tel: links
          /phone["\s:]+([^"'\s]+)/gi,       // phone labels
          /telefon["\s:]+([^"'\s]+)/gi,     // telefon labels (Norwegian)
          /hovedkontor["\s:]+([^"'\s]+)/gi, // hovedkontor labels
          /kontor["\s:]+([^"'\s]+)/gi,      // kontor labels
          /sentralbord["\s:]+([^"'\s]+)/gi, // sentralbord labels
          /reception["\s:]+([^"'\s]+)/gi,   // reception labels
          /kundeservice["\s:]+([^"'\s]+)/gi // kundeservice labels
        ]
        
        for (const pattern of phonePatterns) {
          const matches = html.match(pattern)
          if (matches && matches.length > 0) {
            let phone = matches[0]
            if (phone.startsWith('tel:')) {
              phone = phone.substring(4)
            }
            phone = phone.replace(/[^\d+]/g, '')
            
            if (phone.length >= 8) {
              console.log('Found phone in contact page:', phone)
              return phone
            }
          }
        }
      } catch (error) {
        // Continue to next contact URL
      }
    }
    
    return null
  } catch (error) {
    console.log('Error searching contact page:', error)
    return null
  }
}

async function searchGoogleForPhone(companyName: string, orgNumber: string): Promise<string | null> {
  try {
    console.log('Searching Google for phone number:', companyName)
    
    // Create Google search query for company phone number
    const searchQuery = encodeURIComponent(`${companyName} telefon telefonnummer ${orgNumber}`)
    const searchUrl = `https://www.google.com/search?q=${searchQuery}&hl=no&gl=no`
    
    // Realistic headers for Google
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'nb-NO,nb;q=0.9,no;q=0.8,en-US;q=0.7,en;q=0.6',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    }
    
    // Add delay to avoid being flagged
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
    
    const response = await fetch(searchUrl, {
      headers,
      signal: AbortSignal.timeout(15000)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const html = await response.text()
    
    // Look for phone numbers in Google search results
    // Priority 1: Norwegian landline numbers (2xxxxxxx, 3xxxxxxx)
    const landlinePattern = /(?:\+47|0047)?\s*[2-3]\d{7}/g
    const landlineMatches = html.match(landlinePattern)
    
    if (landlineMatches && landlineMatches.length > 0) {
      const phone = landlineMatches[0].replace(/[^\d+]/g, '')
      console.log('Found landline phone in Google search:', phone)
      return phone
    }
    
    // Priority 2: Norwegian special numbers (8xxxxxxx)
    const specialPattern = /(?:\+47|0047)?\s*[8]\d{7}/g
    const specialMatches = html.match(specialPattern)
    
    if (specialMatches && specialMatches.length > 0) {
      const phone = specialMatches[0].replace(/[^\d+]/g, '')
      console.log('Found special phone in Google search:', phone)
      return phone
    }
    
    // Priority 3: Norwegian mobile numbers (4xxxxxxx, 9xxxxxxx)
    const mobilePattern = /(?:\+47|0047)?\s*[49]\d{7}/g
    const mobileMatches = html.match(mobilePattern)
    
    if (mobileMatches && mobileMatches.length > 0) {
      const phone = mobileMatches[0].replace(/[^\d+]/g, '')
      console.log('Found mobile phone in Google search (fallback):', phone)
      return phone
    }
    
    // Priority 4: Look for phone numbers in specific contexts
    const contextPatterns = [
      /telefon[:\s]+([2-3]\d{7})/gi,      // telefon: 2xxxxxxx
      /telefon[:\s]+([8]\d{7})/gi,         // telefon: 8xxxxxxx
      /telefon[:\s]+([49]\d{7})/gi,        // telefon: 4xxxxxxx or 9xxxxxxx
      /tlf[:\s]+([2-3]\d{7})/gi,           // tlf: 2xxxxxxx
      /tlf[:\s]+([8]\d{7})/gi,             // tlf: 8xxxxxxx
      /tlf[:\s]+([49]\d{7})/gi,            // tlf: 4xxxxxxx or 9xxxxxxx
      /phone[:\s]+([2-3]\d{7})/gi,         // phone: 2xxxxxxx
      /phone[:\s]+([8]\d{7})/gi,            // phone: 8xxxxxxx
      /phone[:\s]+([49]\d{7})/gi            // phone: 4xxxxxxx or 9xxxxxxx
    ]
    
    for (const pattern of contextPatterns) {
      const matches = html.match(pattern)
      if (matches && matches.length > 0) {
        const phone = matches[1] || matches[0].replace(/[^\d+]/g, '')
        if (phone && phone.length >= 8) {
          console.log('Found phone in Google search context:', phone)
          return phone
        }
      }
    }
    
    return null
  } catch (error) {
    console.log('Error searching Google:', error)
    return null
  }
}
