// Sample content for the public demo account (fictional person).

export const DEMO_RESUME = `Alex Chen
alex.chen@example.com | (416) 555-0198 | linkedin.com/in/alexchen | github.com/alexchen

SUMMARY
Software engineering graduate who builds full-stack web apps with React, TypeScript and Node.js. Two internships shipping production features, plus side projects used by real people.

EXPERIENCE
Software Developer Intern, Maplebridge Health (May 2024 – Aug 2024)
- Built a React and TypeScript scheduling screen used by 120 clinic staff, replacing a paper process
- Cut the patient search page's load time from 3.1s to 0.9s by adding pagination and an index in PostgreSQL
- Wrote integration tests for the booking API with Jest, raising coverage from 41% to 78%

Web Developer Intern, Lakeshore Credit Union (Jan 2024 – Apr 2024)
- Rebuilt the member FAQ in Next.js with server rendering, improving its Lighthouse score from 62 to 95
- Fixed 30+ accessibility issues found in an audit (keyboard navigation, colour contrast, form labels)

PROJECTS
StudySync: real-time study-group planner (Next.js, Node.js, PostgreSQL, WebSockets)
- Live shared calendars with conflict detection; 300 student users in its first term
Budget Bot: Python Telegram bot that categorizes spending from bank CSV exports

SKILLS
TypeScript, JavaScript, React, Next.js, Node.js, Python, SQL, PostgreSQL, Git, Tailwind CSS, Jest, REST APIs

EDUCATION
B.Sc. Computer Science, University of Toronto, 2025`

export const DEMO_KIT = {
  resume: `Alex Chen
alex.chen@example.com | (416) 555-0198 | linkedin.com/in/alexchen | github.com/alexchen

SUMMARY
Full-stack developer who builds collaborative, real-time web apps with React, TypeScript and Node.js. Shipped production features at two internships and built a real-time planner used by 300 students.

PROJECTS
StudySync: real-time study-group planner (Next.js, Node.js, PostgreSQL, WebSockets)
- Built live shared calendars that sync between users over WebSockets, with conflict detection
- Grew to 300 student users in its first term

EXPERIENCE
Software Developer Intern, Maplebridge Health (May 2024 – Aug 2024)
- Cut the patient search page's load time from 3.1s to 0.9s with pagination and a PostgreSQL index
- Built a React and TypeScript scheduling screen used by 120 staff, replacing a paper process
- Raised booking API test coverage from 41% to 78% with Jest integration tests

Web Developer Intern, Lakeshore Credit Union (Jan 2024 – Apr 2024)
- Rebuilt a high-traffic page in Next.js with server rendering, raising its Lighthouse score from 62 to 95
- Fixed 30+ accessibility issues, including keyboard navigation and form labels

SKILLS
TypeScript, React, Next.js, Node.js, PostgreSQL, SQL, WebSockets, REST APIs, Jest, Git, Tailwind CSS, Python

EDUCATION
B.Sc. Computer Science, University of Toronto, 2025`,
  coverLetter: `Dear Notion hiring team,

I use Notion every day to plan my own projects, and the part that impresses me most is how edits from other people simply appear. Building that kind of real-time collaboration is what I enjoyed most in my own work: StudySync, a study-group planner I built with Next.js and WebSockets, keeps shared calendars in sync between users and grew to 300 students in its first term.

At my internships I shipped production features end to end. At Maplebridge Health I cut a key search page from 3.1 to 0.9 seconds and built a scheduling screen used by 120 staff; at Lakeshore Credit Union I rebuilt a high-traffic page in Next.js and fixed more than 30 accessibility issues.

I would like to bring that care for performance and detail to Notion's workspace. Thank you for considering my application.

Alex Chen`,
  answers: [
    { question: 'Why do you want to work here?', answer: 'Notion is a tool I rely on daily, and real-time collaboration is the kind of problem I most enjoy. Building live shared calendars for StudySync showed me how much care it takes to make syncing feel invisible, and I want to learn from a team that does it at Notion\'s scale.' },
    { question: 'Why are you a good fit for this role?', answer: 'I build across the stack with React, TypeScript, Node.js and PostgreSQL, and I have shipped production features at two internships, including a 70% faster search page. My StudySync project gave me hands-on experience with WebSockets and keeping state in sync between users.' },
    { question: 'Tell us about a relevant project or accomplishment.', answer: 'At Maplebridge Health the patient search page took over three seconds to load. I profiled it, added server-side pagination and a PostgreSQL index, and brought it down to 0.9 seconds, which staff noticed the same week.' },
    { question: 'What are your salary expectations?', answer: 'I am targeting roughly $65k–$95k CAD, and I am flexible depending on the overall package and the role\'s scope.' },
  ],
  notes: [
    'The posting mentions Redis; the résumé does not show Redis experience.',
    'The role is paid in USD; check how Notion handles remote employees in Canada.',
  ],
  matchedKeywords: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'real-time'],
  missingKeywords: ['Redis'],
}
