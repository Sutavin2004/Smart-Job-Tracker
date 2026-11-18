/**
 * Starter email templates every new account gets. {{Placeholders}} are filled in on use.
 * Written to sound like a person: short, specific, no stock enthusiasm.
 */
export const DEFAULT_TEMPLATES = [
  {
    name: 'Follow-up after applying',
    subject: 'Following up: {{Role}} application',
    body: "Hi {{Name}},\n\nI applied for the {{Role}} position at {{Company}} last week and wanted to check in. The work on {{Topic}} is a big part of why I applied, and my experience with {{Skills}} lines up closely with what the posting describes.\n\nIf it would help, I'm happy to share more about my background or answer any questions.\n\nThanks,\n{{YourName}}",
    type: 'follow_up',
    isDefault: true,
  },
  {
    name: 'Thank-you after an interview',
    subject: 'Thank you for today',
    body: "Hi {{Name}},\n\nThanks for taking the time to talk with me today about the {{Role}} role. I especially appreciated hearing about {{Topic}}. It gave me a clearer picture of what the team is working on and where I could help.\n\nPlease let me know if there's anything else you need from me.\n\nBest,\n{{YourName}}",
    type: 'thank_you',
    isDefault: true,
  },
  {
    name: 'Withdrawing an application',
    subject: 'Withdrawing my application: {{Role}}',
    body: "Hi {{Name}},\n\nI wanted to let you know that I'm withdrawing my application for the {{Role}} position, as I've accepted another offer.\n\nThank you for your time and for the conversations so far. I'd be glad to stay in touch.\n\nBest,\n{{YourName}}",
    type: 'withdraw',
    isDefault: true,
  },
  {
    name: 'Salary counter-offer',
    subject: 'Re: {{Role}} offer',
    body: "Hi {{Name}},\n\nThank you for the offer. I'm keen to join {{Company}} and I'm happy with the role and the team.\n\nBefore I accept, I'd like to talk about the base salary. Based on similar roles in {{City}} and what I'd bring to the team, I was hoping for something closer to {{Counter}}. Is there flexibility there?\n\nI'm glad to talk it through on a call if that's easier.\n\nBest,\n{{YourName}}",
    type: 'counter_offer',
    isDefault: true,
  },
  {
    name: 'Reaching out to a hiring manager',
    subject: '{{Role}} at {{Company}}',
    body: "Hi {{Name}},\n\nI'm {{YourName}}, and I saw that {{Company}} is hiring for a {{Role}}. I've been working with {{Skills}}, most recently on {{RecentWork}}, and the posting reads like a close match.\n\nWould you be open to a 15-minute call in the next couple of weeks? I'd like to learn what the team is focused on and whether my background would be useful.\n\nThanks,\n{{YourName}}",
    type: 'cold_outreach',
    isDefault: true,
  },
]

export function defaultTemplatesFor(userId: string) {
  return DEFAULT_TEMPLATES.map(t => ({ ...t, userId }))
}
