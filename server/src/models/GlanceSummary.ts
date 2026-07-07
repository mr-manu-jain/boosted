import mongoose, { Schema } from 'mongoose';

const glanceSummarySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    periodType: { type: String, enum: ['day', 'week'], required: true },
    periodKey: { type: String, required: true },
    /** hash of the aggregate stats the summary was generated from */
    statsHash: { type: String, required: true },
    aiSummary: { type: String, default: null },
    aiTips: { type: String, default: null },
    generatedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

glanceSummarySchema.index({ user: 1, periodType: 1, periodKey: 1 }, { unique: true });

export const GlanceSummary = mongoose.model('GlanceSummary', glanceSummarySchema);
