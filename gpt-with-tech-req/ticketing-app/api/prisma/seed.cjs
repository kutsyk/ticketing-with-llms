// api/prisma/seed.cjs

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // --- Create admin user ---
  const adminEmail = 'admin@example.com';
  const adminPassword = 'Admin123!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password_hash: passwordHash,
      name: 'System Admin',
      role: 'ADMIN',
      email_verified_at: new Date(),
    },
  });

  console.log(`✅ Admin user ready: ${admin.email} / ${adminPassword}`);

  // --- Create sample event ---
  const event = await prisma.event.create({
    data: {
      name: 'Sample Concert',
      description: 'An amazing evening of live music.',
      venue: 'Downtown Arena',
      starts_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
      ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // +3 hours
      timezone: 'UTC',
      status: 'PUBLISHED',
    },
  });

  console.log(`🎤 Event created: ${event.name}`);

  // --- Create ticket type ---
  const ticketType = await prisma.ticketType.create({
    data: {
      event_id: event.id,
      name: 'General Admission',
      description: 'Standing area ticket',
      price_cents: 5000,
      currency: 'USD',
      quantity_total: 100,
      sales_start_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // started yesterday
      sales_end_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // ends 6 days from now
    },
  });

  console.log(`🎟 Ticket type created: ${ticketType.name}`);
  ticketTypeId = ticketType.id;
  console.log(ticketTypeId);
  // --- Create a sample ticket assigned to admin ---
  const ticket = await prisma.ticket.create({
    data: {
      user_id: admin.id,
      ticket_type_id: ticketTypeId,
      serial: `T-${Date.now()}`,
      qr_token: `QR-${Date.now()}`,
      status: 'ISSUED',
      delivery_email: admin.email,
      purchaser_name: admin.name,
      issued_at: new Date(),
      expires_at: new Date(event.ends_at),
    },
  });

  console.log(`🎫 Ticket issued to admin: ${ticket.serial}`);

  console.log('🌱 Seed completed successfully.');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
