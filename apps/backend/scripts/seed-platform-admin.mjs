import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i], process.argv[i + 1]);
}

const email = args.get("--email") ?? "platform@autocitas.com";
const password = args.get("--password") ?? "platform123";

if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI env");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

const AdminUser = mongoose.model(
  "AdminUser",
  new mongoose.Schema(
    {
      businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business" },
      email: { type: String, unique: true, lowercase: true },
      passwordHash: String,
      role: { type: String, default: "platform_admin" },
      active: { type: Boolean, default: true }
    },
    { timestamps: true }
  )
);

const existing = await AdminUser.findOne({ email: email.toLowerCase() });
if (existing) {
  console.log("Platform admin already exists", existing._id.toString());
  await mongoose.disconnect();
  process.exit(0);
}

const passwordHash = await bcrypt.hash(password, 10);
const admin = await AdminUser.create({
  email: email.toLowerCase(),
  passwordHash,
  role: "platform_admin",
  active: true
});

console.log("Created platform admin", admin._id.toString());
console.log("Email:", email);
console.log("Password:", password);
await mongoose.disconnect();
