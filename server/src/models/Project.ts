import mongoose, { Schema } from 'mongoose';

const projectSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    color: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

projectSchema.index({ user: 1, archived: 1 });

export const Project = mongoose.model('Project', projectSchema);
