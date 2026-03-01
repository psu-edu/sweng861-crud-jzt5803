/**
 * Seed script — creates the admin master account and sample campus metrics.
 *
 * Run from project root:
 *   node scripts/seed.js
 *
 * Admin credentials:
 *   username: admin
 *   password: Campus123!
 */

const bcrypt = require('bcryptjs');

// Bootstrap models (CommonJS)
const { sequelize } = require('../lib/db');
const User = require('../lib/models/User');
const Metric = require('../lib/models/Metric');

// Associations (required for sync)
User.hasMany(Metric, { foreignKey: 'userId', onDelete: 'CASCADE' });
Metric.belongsTo(User, { foreignKey: 'userId' });

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Campus123!';

const SAMPLE_METRICS = [
  // Enrollment
  {
    name: 'Fall 2025 Total Enrollment',
    category: 'enrollment',
    value: 47892,
    unit: 'students',
    description:
      'Total headcount enrollment for the Fall 2025 semester across all campuses.',
  },
  {
    name: 'Graduate Students Enrolled',
    category: 'enrollment',
    value: 8340,
    unit: 'students',
    description:
      'Number of graduate and professional students enrolled in Fall 2025.',
  },
  {
    name: 'International Students',
    category: 'enrollment',
    value: 5210,
    unit: 'students',
    description:
      'Total international student enrollment for current academic year.',
  },
  {
    name: 'Spring 2026 New Admits',
    category: 'enrollment',
    value: 1850,
    unit: 'students',
    description:
      'Newly admitted students beginning their studies in Spring 2026.',
  },
  // Facilities
  {
    name: 'Campus Building Square Footage',
    category: 'facilities',
    value: 3240000,
    unit: 'sq ft',
    description:
      'Total gross square footage across all university-owned buildings.',
  },
  {
    name: 'Residence Hall Occupancy Rate',
    category: 'facilities',
    value: 94.2,
    unit: '%',
    description: 'Percentage of on-campus housing beds currently occupied.',
  },
  {
    name: 'Parking Spaces Available',
    category: 'facilities',
    value: 12800,
    unit: 'spaces',
    description:
      'Total registered parking spaces across all University Park lots.',
  },
  {
    name: 'Campus WiFi Access Points',
    category: 'facilities',
    value: 6500,
    unit: 'access points',
    description:
      'Number of wireless access points providing campus-wide coverage.',
  },
  // Academic
  {
    name: 'Average 4-Year Graduation Rate',
    category: 'academic',
    value: 68.5,
    unit: '%',
    description:
      '4-year graduation rate for the most recent cohort of first-year students.',
  },
  {
    name: 'Faculty-to-Student Ratio',
    category: 'academic',
    value: 16,
    unit: 'students per faculty',
    description:
      'Overall university-wide faculty-to-student ratio for Fall 2025.',
  },
  {
    name: 'Research Grants Awarded',
    category: 'academic',
    value: 312,
    unit: 'grants',
    description:
      'Number of externally funded research grants active in FY2025.',
  },
  {
    name: 'Courses Offered This Semester',
    category: 'academic',
    value: 8750,
    unit: 'courses',
    description: 'Total unique course sections available during Spring 2026.',
  },
  // Financial
  {
    name: 'Annual Operating Budget',
    category: 'financial',
    value: 2100000000,
    unit: 'USD',
    description: 'University total operating budget for fiscal year 2025.',
  },
  {
    name: 'Research Expenditures FY2025',
    category: 'financial',
    value: 1040000000,
    unit: 'USD',
    description:
      'Total research and development expenditures for fiscal year 2025.',
  },
  {
    name: 'Financial Aid Awarded',
    category: 'financial',
    value: 580000000,
    unit: 'USD',
    description:
      'Total financial aid distributed to students in academic year 2024-25.',
  },
  {
    name: 'Endowment Value',
    category: 'financial',
    value: 4600000000,
    unit: 'USD',
    description: 'Current market value of the university endowment portfolio.',
  },
  // Other
  {
    name: 'Alumni Network Size',
    category: 'other',
    value: 775000,
    unit: 'alumni',
    description: 'Total number of living Penn State alumni worldwide.',
  },
  {
    name: 'Campus Carbon Emissions',
    category: 'other',
    value: 185000,
    unit: 'metric tons CO2e',
    description:
      'Total Scope 1 and Scope 2 carbon emissions for calendar year 2024.',
  },
  {
    name: 'Library Resources (eBooks)',
    category: 'other',
    value: 1250000,
    unit: 'titles',
    description:
      'Number of electronic books available through the university libraries.',
  },
  {
    name: 'Student Organizations',
    category: 'other',
    value: 1000,
    unit: 'organizations',
    description: 'Total number of registered student organizations on campus.',
  },
];

async function seed() {
  console.log('🌱  Seeding Campus Analytics database...\n');

  await sequelize.sync({ alter: true });

  // --- Admin user ---
  let admin = await User.findOne({ where: { username: ADMIN_USERNAME } });

  if (admin) {
    console.log(
      `ℹ️   Admin user '${ADMIN_USERNAME}' already exists (id=${admin.id}) — skipping creation.`
    );
  } else {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
    admin = await User.create({
      username: ADMIN_USERNAME,
      password: hashedPassword,
      role: 'admin',
    });
    console.log(
      `✅  Admin user created:  username=${ADMIN_USERNAME}  password=${ADMIN_PASSWORD}  role=admin`
    );
  }

  // --- Sample metrics ---
  let created = 0;
  let skipped = 0;

  for (const m of SAMPLE_METRICS) {
    const existing = await Metric.findOne({
      where: { name: m.name, userId: admin.id },
    });

    if (existing) {
      skipped++;
    } else {
      await Metric.create({ ...m, userId: admin.id });
      created++;
    }
  }

  console.log(`✅  Metrics: ${created} created, ${skipped} already existed.\n`);
  console.log('─────────────────────────────────────────');
  console.log('  Admin credentials');
  console.log('─────────────────────────────────────────');
  console.log(`  Username : ${ADMIN_USERNAME}`);
  console.log(`  Password : ${ADMIN_PASSWORD}`);
  console.log('─────────────────────────────────────────\n');

  await sequelize.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
