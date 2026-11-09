/** Starter email templates every new account gets. {{Placeholders}} are filled in on use. */
export const DEFAULT_TEMPLATES = [
  {
    name: 'Follow-Up After Applying',
    subject: 'Following up on my application — {{Role}} at {{Company}}',
    body: "Hi {{Name}},\n\nI wanted to follow up on my application for the {{Role}} position at {{Company}}. I'm very excited about this opportunity and believe my skills in {{Skills}} would be a great fit.\n\nWould you have 15 minutes this week to chat?\n\nBest regards,\n{{YourName}}",
    type: 'follow_up',
    isDefault: true,
  },
  {
    name: 'Thank You After Interview',
    subject: 'Thank you — {{Role}} Interview',
    body: "Hi {{Name}},\n\nThank you so much for taking the time to speak with me today about the {{Role}} role. I really enjoyed learning more about the team and the exciting work happening at {{Company}}.\n\nThe discussion about {{Topic}} was particularly fascinating. I'm even more enthusiastic about joining the team.\n\nI look forward to hearing from you.\n\nBest,\n{{YourName}}",
    type: 'thank_you',
    isDefault: true,
  },
  {
    name: 'Withdrawing Application',
    subject: 'Withdrawing my application — {{Role}}',
    body: "Hi {{Name}},\n\nI wanted to let you know that I need to withdraw my application for the {{Role}} position. I have accepted another offer that is more aligned with my current career goals.\n\nThank you for your time and consideration. I have a lot of respect for {{Company}} and hope our paths cross in the future.\n\nBest regards,\n{{YourName}}",
    type: 'withdraw',
    isDefault: true,
  },
  {
    name: 'Salary Counter Offer',
    subject: 'Re: Offer for {{Role}}',
    body: "Hi {{Name}},\n\nThank you so much for the offer! I'm genuinely excited about joining {{Company}}.\n\nAfter reviewing the details, I'd like to respectfully discuss the base salary. Based on my research and the skills I bring, I was hoping we could get closer to {{Counter}}. I believe this reflects the market rate for someone with my background.\n\nI remain very enthusiastic about this role and hope we can find an agreement that works for both of us.\n\nBest,\n{{YourName}}",
    type: 'counter_offer',
    isDefault: true,
  },
  {
    name: 'Cold Outreach to Hiring Manager',
    subject: 'Reaching out about {{Role}} opportunities at {{Company}}',
    body: "Hi {{Name}},\n\nMy name is {{YourName}} and I'm a Computer Science student passionate about building great software. I've been following {{Company}}'s work on {{Product/Area}} and am deeply impressed.\n\nI noticed you're hiring for {{Role}} and I'd love to learn more. My background in {{Skills}} aligns well with what I see in the job description.\n\nWould you be open to a 15-minute chat? I promise to make it worth your time.\n\nBest,\n{{YourName}}",
    type: 'cold_outreach',
    isDefault: true,
  },
]

export function defaultTemplatesFor(userId: string) {
  return DEFAULT_TEMPLATES.map(t => ({ ...t, userId }))
}
