import mongoose, { Schema } from 'mongoose';

const timeEntrySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    task: { type: Schema.Types.ObjectId, ref: 'Task', default: null },
    startTime: { type: Date, required: true },
    endTime: { type: Date, default: null },
    durationSeconds: { type: Number, default: null, min: 0 },
    dayKey: { type: String, required: true },
    note: { type: String, default: null, maxlength: 500 },
  },
  { timestamps: true },
);

timeEntrySchema.index({ user: 1, startTime: -1 });
timeEntrySchema.index({ user: 1, dayKey: 1 });
timeEntrySchema.index({ project: 1, startTime: -1 });
// at most one running entry per user, enforced at the DB level
timeEntrySchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { endTime: null } },
);

export const TimeEntry = mongoose.model('TimeEntry', timeEntrySchema);
