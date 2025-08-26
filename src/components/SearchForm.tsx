'use client'

import { useState } from 'react'
import { SearchFilters } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void
  isLoading: boolean
}

// Vanlige NACE-koder som eksempel (basert på BRREG data)
const COMMON_NACE_CODES = [
  { code: '62', description: 'Programvareutvikling og IT-tjenester' },
  { code: '94', description: 'Interesseorganisasjoner' },
  { code: '41', description: 'Bygging av bygninger' },
  { code: '43', description: 'Spesialisert byggearbeid' },
  { code: '47', description: 'Butikkhandel' },
  { code: '56', description: 'Serveringssteder' },
  { code: '70', description: 'Administrasjon og støttetjenester' },
  { code: '85', description: 'Utdanning' }
]

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    naceCodes: [],
    postnummer: '',
    kommunenummer: '',
    enhetType: 'hovedenhet'
  })

  const [naceInput, setNaceInput] = useState('')

  const handleNaceAdd = () => {
    if (naceInput.trim() && !filters.naceCodes.includes(naceInput.trim())) {
      setFilters(prev => ({
        ...prev,
        naceCodes: [...prev.naceCodes, naceInput.trim()]
      }))
      setNaceInput('')
    }
  }

  const handleNaceRemove = (code: string) => {
    setFilters(prev => ({
      ...prev,
      naceCodes: prev.naceCodes.filter(c => c !== code)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(filters)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* NACE-koder */}
        <div className="space-y-3">
          <Label htmlFor="nace">NACE-koder</Label>
          <div className="flex gap-2">
            <Input
              id="nace"
              type="text"
              placeholder="F.eks. 620100"
              value={naceInput}
              onChange={(e) => setNaceInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleNaceAdd())}
            />
            <Button type="button" onClick={handleNaceAdd} variant="outline">
              Legg til
            </Button>
          </div>
          
          {/* Vanlige NACE-koder som eksempel */}
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Vanlige NACE-koder:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {COMMON_NACE_CODES.map(({ code, description }) => (
                <div key={code} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!filters.naceCodes.includes(code)) {
                        setFilters(prev => ({
                          ...prev,
                          naceCodes: [...prev.naceCodes, code]
                        }))
                      }
                    }}
                    className="text-primary hover:underline font-mono"
                    disabled={filters.naceCodes.includes(code)}
                  >
                    {code}
                  </button>
                  <span className="text-muted-foreground">- {description}</span>
                </div>
              ))}
            </div>
          </div>
          
          {filters.naceCodes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.naceCodes.map((code) => (
                <div key={code} className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-md">
                  <span className="text-sm font-mono">{code}</span>
                  <button
                    type="button"
                    onClick={() => handleNaceRemove(code)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Postnummer */}
        <div className="space-y-3">
          <Label htmlFor="postnummer">Postnummer</Label>
          <Input
            id="postnummer"
            type="text"
            placeholder="F.eks. 0001 eller 0001,0002"
            value={filters.postnummer}
            onChange={(e) => setFilters(prev => ({ ...prev, postnummer: e.target.value }))}
          />
        </div>

        {/* Kommunenummer */}
        <div className="space-y-3">
          <Label htmlFor="kommunenummer">Kommunenummer</Label>
          <Input
            id="kommunenummer"
            type="text"
            placeholder="F.eks. 0301"
            value={filters.kommunenummer}
            onChange={(e) => setFilters(prev => ({ ...prev, kommunenummer: e.target.value }))}
          />
        </div>

        {/* Enhetstype */}
        <div className="space-y-3">
          <Label htmlFor="enhetType">Enhetstype</Label>
          <Select
            value={filters.enhetType}
            onValueChange={(value: 'hovedenhet' | 'underenhet') => 
              setFilters(prev => ({ ...prev, enhetType: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hovedenhet">Hovedenhet</SelectItem>
              <SelectItem value="underenhet">Underenhet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
        {isLoading ? 'Søker...' : 'Søk'}
      </Button>
    </form>
  )
}
