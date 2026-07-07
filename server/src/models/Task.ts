import mongoose, { Schema } from 'mongoose';

const taskSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    completed: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

taskSchema.index({ project: 1, archived: 1 });

export const Task = mongoose.model('Task', taskSchema);
