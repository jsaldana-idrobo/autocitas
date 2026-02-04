import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i], process.argv[i + 1]);
}

const email = args.get("--email");
const password = args.get("--password");
const businessName = args.get("--businessName") ?? "Autocitas";
const businessSlug = args.get("--businessSlug") ?? "autocitas";

if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI env");
  process.exit(1);
}

if (!email || !password) {
  console.error("Usage: node scripts/seed-admin.mjs --email you@domain.com --password secret [--businessName Name] [--businessSlug slug]");
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
      status: { type: String, default: "active" }
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
      active: { type: Boolean, default: true }
    },
    { timestamps: true }
  )
);

let business = await Business.findOne({ slug: businessSlug });
if (!business) {
  business = await Business.create({ name: businessName, slug: businessSlug });
  console.log("Created business", business._id.toString());
}

const existing = await AdminUser.findOne({ email: email.toLowerCase() });
if (existing) {
  console.log("Admin user already exists", existing._id.toString());
  await mongoose.disconnect();
  process.exit(0);
}

const passwordHash = await bcrypt.hash(password, 10);
const admin = await AdminUser.create({
  businessId: business._id,
  email: email.toLowerCase(),
  passwordHash,
  role: "owner",
  active: true
});

console.log("Created admin", admin._id.toString());
await mongoose.disconnect();
