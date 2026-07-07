/**
 * Seeds a demo account with ~10 months of realistic tracking data.
 *
 *   npm run seed                  -> seeds demo@boosted.dev / password123
 *   npm run seed -- you@mail.com  -> seeds an existing account by email
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Project } from './models/Project.js';
import { Task } from './models/Task.js';
import { TimeEntry } from './models/TimeEntry.js';
import { GlanceSummary } from './models/GlanceSummary.js';
import { getDayKey } from './utils/dateKey.js';

const DEMO_EMAIL = 'demo@boosted.dev';
const DEMO_PASSWORD = 'password123';
const TIMEZONE = 'America/Los_Angeles';
const SEED_DAYS = 300;

interface ProjectSpec {
  name: string;
  color: string;
  tasks: string[];
  /** probability this project is worked on an active day */
  p: number;
  /** typical session length range, minutes */
  session: [number, number];
  /** max sessions per day */
  maxSessions: number;
}

const SPECS: ProjectSpec[] = [
  { name: 'Work', color: '#4a3aa7', tasks: ['Daily meeting', 'Prepare conference presentation', 'Code review'], p: 0.85, session: [45, 150], maxSessions: 3 },
  { name: 'UI/UX Design', color: '#1baf7a', tasks: ['Landing page', 'Design system', 'Mobile mockups'], p: 0.45, session: [40, 120], maxSessions: 2 },
  { name: 'Reading Books', color: '#e87ba4', tasks: ['Dan Brown - Origin', 'Design patterns', 'Walter Isaacson - Steve Jobs'], p: 0.5, session: [20, 70], maxSessions: 2 },
  { name: 'Health', color: '#eda100', tasks: ['Workout', 'Morning run'], p: 0.55, session: [30, 75], maxSessions: 1 },
  { name: 'Meditation', color: '#008300', tasks: [], p: 0.4, session: [10, 30], maxSessions: 1 },
  { name: 'Free time', color: '#2a78d6', tasks: [], p: 0.35, session: [30, 90], maxSessions: 2 },
  { name: 'Painting', color: '#eb6834', tasks: ['Watercolor landscape'], p: 0.18, session: [40, 100], maxSessions: 1 },
];

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  const emailArg = process.argv[2]?.toLowerCase();
  await connectDB();

  let user;
  if (emailArg) {
    user = await User.findOne({ email: emailArg });
    if (!user) {
      console.error(`No account found for ${emailArg} — sign up first, then re-run.`);
      process.exit(1);
    }
  } else {
    user = await User.findOne({ email: DEMO_EMAIL });
    if (!user) {
      user = await User.create({
        name: 'Demo User',
        email: DEMO_EMAIL,
        passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
        timezone: TIMEZONE,
      });
      console.log(`Created ${DEMO_EMAIL} (password: ${DEMO_PASSWORD})`);
    }
  }

  // wipe previous data for a clean, deterministic-looking seed
  await Promise.all([
    TimeEntry.deleteMany({ user: user._id }),
    Task.deleteMany({ user: user._id }),
    Project.deleteMany({ user: user._id }),
    GlanceSummary.deleteMany({ user: user._id }),
  ]);

  const timezone = user.timezone ?? TIMEZONE;
  const projectDocs = [];
  const tasksByProject = new Map<string, mongoose.Types.ObjectId[]>();

  for (const spec of SPECS) {
    const project = await Project.create({ user: user._id, name: spec.name, color: spec.color });
    projectDocs.push({ spec, project });
    const ids: mongoose.Types.ObjectId[] = [];
    for (const [i, taskName] of spec.tasks.entries()) {
      const task = await Task.create({
        user: user._id,
        project: project._id,
        name: taskName,
        completed: i >= spec.tasks.length - 1 && Math.random() < 0.4,
      });
      ids.push(task._id);
    }
    tasksByProject.set(String(project._id), ids);
  }

  const entries: Array<Record<string, unknown>> = [];
  const now = new Date();

  for (let daysAgo = SEED_DAYS; daysAgo >= 1; daysAgo--) {
    const dayStart = new Date(now.getTime() - daysAgo * 86400000);
    const weekday = dayStart.getDay(); // 0 Sun .. 6 Sat

    // rest days: most weekends lighter, occasional full off-days
    const offChance = weekday === 0 || weekday === 6 ? 0.45 : 0.18;
    if (Math.random() < offChance) continue;

    // sessions start from 8am local, walk forward through the day
    let clock = new Date(dayStart);
    clock.setHours(8, Math.floor(rand(0, 40)), 0, 0);

    for (const { spec, project } of projectDocs) {
      if (Math.random() > spec.p) continue;
      const sessions = 1 + Math.floor(Math.random() * spec.maxSessions);
      for (let s = 0; s < sessions; s++) {
        const minutes = rand(spec.session[0], spec.session[1]);
        const start = new Date(clock);
        const end = new Date(start.getTime() + minutes * 60000);
        if (end.getHours() >= 23) break;

        const taskIds = tasksByProject.get(String(project._id)) ?? [];
        const task = taskIds.length > 0 && Math.random() < 0.75 ? pick(taskIds) : null;

        entries.push({
          user: user._id,
          project: project._id,
          task,
          startTime: start,
          endTime: end,
          durationSeconds: Math.round(minutes * 60),
          dayKey: getDayKey(start, timezone),
        });

        clock = new Date(end.getTime() + rand(10, 50) * 60000);
      }
    }
  }

  await TimeEntry.insertMany(entries);
  console.log(
    `Seeded ${entries.length} entries across ${SPECS.length} projects for ${user.email}`,
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
