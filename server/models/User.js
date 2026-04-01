import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const holdingSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  avgPrice: { type: Number, required: true },
  totalInvested: { type: Number, required: true },
});

const achievementSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  icon: String,
  unlockedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    avatar: {
      type: String,
      default: "",
    },
    balance: { type: Number, default: 100000 }, // \$100k virtual money
    initialBalance: { type: Number, default: 100000 },
    holdings: [holdingSchema],
    achievements: [achievementSchema],
    totalTrades: { type: Number, default: 0 },
    profitableTrades: { type: Number, default: 0 },
    totalPnL: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual: portfolio value (calculated at runtime with live prices, but we store a snapshot)
userSchema.methods.getNetWorth = function () {
  const holdingsValue = this.holdings.reduce(
    (sum, h) => sum + h.quantity * h.avgPrice,
    0
  );
  return this.balance + holdingsValue;
};

export default mongoose.model("User", userSchema);