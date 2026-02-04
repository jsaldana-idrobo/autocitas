import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i], process.argv[i + 1]);
}

const businessName = args.get("--businessName") ?? "Barberia X";
const businessSlug = args.get("--businessSlug") ?? "barberia-x";
const timezone = args.get("--timezone") ?? "America/Bogota";

const ownerEmail = args.get("--ownerEmail") ?? "owner@demo.com";
const ownerPassword = args.get("--ownerPassword") ?? "owner123";
const staffEmail = args.get("--staffEmail") ?? "staff@demo.com";
const staffPassword = args.get("--staffPassword") ?? "staff123";
const platformEmail = args.get("--platformEmail") ?? "platform@autocitas.com";
const platformPassword = args.get("--platformPassword") ?? "platform123";

const resourceName = args.get("--resourceName") ?? "Barbero 1";
const serviceName = args.get("--serviceName") ?? "Corte clasico";
const serviceDurationMinutes = Number(args.get("--serviceDurationMinutes") ?? 30);

if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI env");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

const Business = mongoose.model(
  "Business",
  new mongoose.Schema(
    {
      name: String,
      slug: { type: String, unique: true },
      timezone: { type: String, default: "America/Bogota" },
      contactPhone: String,
      address: String,
      status: { type: String, default: "active" },
      policies: {
        cancellationHours: { type: Number, default: 24 },
        rescheduleLimit: { type: Number, default: 1 },
        allowSameDay: { type: Boolean, default: true }
      },
      hours: [
        {
          dayOfWeek: Number,
          openTime: String,
          closeTime: String
        }
      ]
    },
    { timestamps: true }
  )
);

const AdminUser = mongoose.model(
  "AdminUser",
  new mongoose.Schema(
    {
      businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business" },
      email: { type: String, unique: true, lowercase: true },
      passwordHash: String,
      role: { type: String, default: "owner" },
      resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Resource" },
      active: { type: Boolean, default: true }
    },
    { timestamps: true }
  )
);

const Resource = mongoose.model(
  "Resource",
  new mongoose.Schema(
    {
      businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
      name: String,
      active: { type: Boolean, default: true }
    },
    { timestamps: true }
  )
);

const Service = mongoose.model(
  "Service",
  new mongoose.Schema(
    {
      businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
      name: String,
      durationMinutes: Number,
      price: Number,
      active: { type: Boolean, default: true },
      allowedResourceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resource" }]
    },
    { timestamps: true }
  )
);

const defaultHours = [
  { dayOfWeek: 1, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 2, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 3, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 4, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 5, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 6, openTime: "09:00", closeTime: "14:00" }
];

let business = await Business.findOne({ slug: businessSlug });
if (!business) {
  business = await Business.create({
    name: businessName,
    slug: businessSlug,
    timezone,
    status: "active",
    policies: { cancellationHours: 24, rescheduleLimit: 1, allowSameDay: true },
    hours: defaultHours
  });
  console.log("Created business", business._id.toString());
} else {
  const shouldUpdateHours = !business.hours || business.hours.length === 0;
  if (shouldUpdateHours) {
    business.hours = defaultHours;
  }
  if (!business.timezone) {
    business.timezone = timezone;
  }
  await business.save();
  console.log("Business exists", business._id.toString());
}

let resource = await Resource.findOne({ businessId: business._id, name: resourceName });
if (!resource) {
  resource = await Resource.create({
    businessId: business._id,
    name: resourceName,
    active: true
  });
  console.log("Created resource", resource._id.toString());
} else {
  console.log("Resource exists", resource._id.toString());
}

let service = await Service.findOne({ businessId: business._id, name: serviceName });
if (!service) {
  service = await Service.create({
    businessId: business._id,
    name: serviceName,
    durationMinutes: serviceDurationMinutes,
    active: true,
    allowedResourceIds: [resource._id]
  });
  console.log("Created service", service._id.toString());
} else {
  const allowed = new Set((service.allowedResourceIds || []).map((id) => id.toString()));
  if (!allowed.has(resource._id.toString())) {
    service.allowedResourceIds = [...(service.allowedResourceIds || []), resource._id];
  }
  if (!service.durationMinutes) {
    service.durationMinutes = serviceDurationMinutes;
  }
  await service.save();
  console.log("Service exists", service._id.toString());
}

async function ensureUser({ email, password, role, businessId, resourceId }) {
  const existing = await AdminUser.findOne({ email: email.toLowerCase() });
  if (existing) {
    const update = {};
    if (role && existing.role !== role) {
      update.role = role;
    }
    if (businessId && (!existing.businessId || existing.businessId.toString() !== businessId)) {
      update.businessId = businessId;
    }
    if (resourceId && (!existing.resourceId || existing.resourceId.toString() !== resourceId)) {
      update.resourceId = resourceId;
    }
    if (Object.keys(update).length > 0) {
      await AdminUser.updateOne({ _id: existing._id }, { $set: update });
      console.log("Updated user", existing._id.toString(), email);
    } else {
      console.log("User exists", existing._id.toString(), email);
    }
    return existing;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await AdminUser.create({
    businessId,
    email: email.toLowerCase(),
    passwordHash,
    role,
    resourceId,
    active: true
  });
  console.log("Created user", created._id.toString(), email);
  return created;
}

await ensureUser({
  email: platformEmail,
  password: platformPassword,
  role: "platform_admin"
});

await ensureUser({
  email: ownerEmail,
  password: ownerPassword,
  role: "owner",
  businessId: business._id.toString()
});

await ensureUser({
  email: staffEmail,
  password: staffPassword,
  role: "staff",
  businessId: business._id.toString(),
  resourceId: resource._id.toString()
});

console.log("Done.");
console.log("Business slug:", businessSlug);
console.log("Owner:", ownerEmail, ownerPassword);
console.log("Staff:", staffEmail, staffPassword);
console.log("Platform admin:", platformEmail, platformPassword);

await mongoose.disconnect();
