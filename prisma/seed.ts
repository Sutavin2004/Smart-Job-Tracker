import { PrismaClient } from '@prisma/client'
import { seedDemoData } from '../src/lib/demo-seed'

const prisma = new PrismaClient()

seedDemoData(prisma)
  .then(() => console.log('✅ Seed complete! Created profile, 10 jobs, interviews, templates, and agent session.'))
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
