const mongoose = require('mongoose');

const moneyPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    currency: { type: String, default: '' },
    budget: { type: mongoose.Schema.Types.Mixed, default: function () { return { income: 0, items: [] }; } },
    goals: { type: mongoose.Schema.Types.Mixed, default: function () { return []; } }
  },
  { timestamps: true, minimize: false }
);

module.exports = mongoose.model('MoneyPlan', moneyPlanSchema);
