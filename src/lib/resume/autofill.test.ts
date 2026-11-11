import { describe, it, expect } from 'vitest'
import { basicFields, parseAutofill, mergeAutofill } from './autofill'

const RESUME = `Sutavin Vinothan
Toronto, ON | sutavin2004@gmail.com | +1 (647) 525-8369 | linkedin.com/in/sutavin-vinothan-9334a7263 | github.com/Sutavin2004 | sutavin-portfolio.netlify.app

EDUCATION
Western University`

describe('basicFields', () => {
  it('pulls contact details and links without AI', () => {
    expect(basicFields(RESUME)).toEqual({
      name: 'Sutavin Vinothan',
      email: 'sutavin2004@gmail.com',
      phone: '+1 (647) 525-8369',
      linkedin: 'https://www.linkedin.com/in/sutavin-vinothan-9334a7263',
      github: 'https://github.com/Sutavin2004',
      portfolio: 'https://sutavin-portfolio.netlify.app',
    })
  })
  it('skips a first line that is not a name', () => {
    expect(basicFields('RESUME 2026 | page 1\nJordan').name).toBeUndefined()
  })
})

describe('parseAutofill', () => {
  it('keeps known fields, joins lists and drops unknown or empty values', () => {
    const r = parseAutofill(`Sure! {"name":"A B","skills":["Python"," Linux ",""],"yearsExperience":"1.6","bio":null,"phone":"n/a","hack":"x","targetRoles":["DevOps Engineer","SRE"]}`)
    expect(r).toEqual({ name: 'A B', skills: 'Python, Linux', yearsExperience: 1, targetRoles: 'DevOps Engineer, SRE' })
  })
  it('returns nothing for unreadable replies', () => {
    expect(parseAutofill('no json')).toEqual({})
    expect(parseAutofill('{bad json')).toEqual({})
  })
})

describe('mergeAutofill', () => {
  it('fills only empty fields unless asked to overwrite', () => {
    const current = { name: 'Typed by user', skills: '', yearsExperience: 0 }
    const found = { name: 'From résumé', skills: 'Python', yearsExperience: 1 }
    expect(mergeAutofill(current, found)).toEqual({ skills: 'Python', yearsExperience: 1 })
    expect(mergeAutofill(current, found, true)).toEqual(found)
  })
})
