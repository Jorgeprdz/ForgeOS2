#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { loadAndValidateQueue } from './validate-queue.mjs';

const EXIT = { FAILED: 1, CONFIG: 64, DEPENDENCY: 69, LOCKED: 73, INTERRUPTED: 130 };
const now = () => new Date().toISOString();
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const duration = start => Math.max(0, Date.now() - start);
const elapsedText = milliseconds => {
  const seconds = Math.floor(milliseconds / 1000);
  return `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds % 3600 / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};

function parseArgs(argv) {
  const options = {
    repo: process.env.FORGE_OVERNIGHT_ROOT || process.cwd(),
    queue: process.env.FORGE_OVERNIGHT_QUEUE || 'tools/overnight/queue.json',
    maxJobs: Number(process.env.FORGE_OVERNIGHT_MAX_JOBS || Number.MAX_SAFE_INTEGER),
    push: process.env.FORGE_OVERNIGHT_PUSH === '1',
    dryRun: false, resume: false, restart: false,
    job: null, from: null, stopAfter: null,
    logLevel: process.env.FORGE_OVERNIGHT_LOG_LEVEL || 'info',
    skipFetch: process.env.FORGE_OVERNIGHT_SKIP_FETCH === '1'
  };
  const valueOptions = new Map([
    ['--repo', 'repo'], ['--queue', 'queue'], ['--max-jobs', 'maxJobs'],
    ['--job', 'job'], ['--from', 'from'], ['--stop-after', 'stopAfter'],
    ['--log-level', 'logLevel']
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (valueOptions.has(argument)) {
      if (index + 1 >= argv.length) throw new Error(`MISSING_OPTION_VALUE:${argument}`);
      options[valueOptions.get(argument)] = argv[++index];
    } else if (argument === '--push') options.push = true;
    else if (argument === '--no-push') options.push = false;
    else if (argument === '--dry-run') options.dryRun = true;
    else if (argument === '--resume') options.resume = true;
    else if (argument === '--restart') options.restart = true;
    else if (argument === '--help') options.help = true;
    else throw new Error(`UNKNOWN_OPTION:${argument}`);
  }
  options.maxJobs = Number(options.maxJobs);
  if (!Number.isInteger(options.maxJobs) || options.maxJobs < 1) throw new Error('INVALID_MAX_JOBS');
  if (!['debug', 'info', 'warn', 'error'].includes(options.logLevel)) throw new Error('INVALID_LOG_LEVEL');
  return options;
}

const help = `Usage: forge-overnight-deterministic.sh [options]
  --repo PATH           Repository root
  --queue PATH          Queue path (relative paths resolve inside repo)
  --max-jobs N          Maximum enabled jobs to execute
  --push | --no-push    Enable or disable queue-authorized pushes
  --dry-run             Validate and display plan; no state, Git, commands, commits or push
  --resume              Resume matching state/checkpoints
  --restart             Archive prior state and start over
  --job ID              Execute one job (dependencies must already be complete)
  --from ID             Start selection at ID
  --stop-after ID       Stop after ID
  --log-level LEVEL     debug, info, warn or error
`;

function git(root, args, options = {}) {
  const result = spawnSync('git', args, {
    cwd: root, encoding: 'utf8', stdio: options.inherit ? 'inherit' : 'pipe'
  });
  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(`GIT_FAILED:${args.join(' ')}:${(result.stderr || '').trim()}`);
  }
  return result;
}

function atomicJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}.${process.pid}.${crypto.randomUUID()}.tmp`);
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporary, file);
}

function atomicText(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}.${process.pid}.${crypto.randomUUID()}.tmp`);
  fs.writeFileSync(temporary, value, { mode: 0o600 });
  fs.renameSync(temporary, file);
}

function changedPaths(root) {
  const output = git(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all']).stdout;
  const fields = output.split('\0').filter(Boolean);
  const paths = [];
  for (let index = 0; index < fields.length; index += 1) {
    const record = fields[index];
    const status = record.slice(0, 2);
    let name = record.slice(3);
    if ((status.includes('R') || status.includes('C')) && fields[index + 1]) name = fields[++index];
    if (!name.startsWith('.forge/overnight/')) paths.push(name);
  }
  return [...new Set(paths)].sort();
}

function matches(pattern, candidate) {
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3);
    return candidate === prefix || candidate.startsWith(`${prefix}/`);
  }
  if (pattern.endsWith('/')) return candidate.startsWith(pattern);
  return candidate === pattern;
}

function assertPathScope(paths, allowed, forbidden, label) {
  const forbiddenHits = paths.filter(candidate => forbidden.some(pattern => matches(pattern, candidate)));
  if (forbiddenHits.length) throw new Error(`${label}_FORBIDDEN_CHANGED_PATHS:${forbiddenHits.join(',')}`);
  const outside = paths.filter(candidate => !allowed.some(pattern => matches(pattern, candidate)));
  if (outside.length) throw new Error(`${label}_OUTSIDE_ALLOWED_PATHS:${outside.join(',')}`);
}

function queueJobHash(job) {
  return hash(JSON.stringify(job));
}

class Runner {
  constructor(options, queue, queueBytes) {
    this.options = options;
    this.root = path.resolve(options.repo);
    this.queue = queue;
    this.queueHash = hash(queueBytes);
    this.stateRoot = path.join(this.root, '.forge/overnight');
    this.stateFile = path.join(this.stateRoot, 'state.json');
    this.lockDir = path.join(this.stateRoot, 'lock');
    this.runId = `${new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '')}-${process.pid}-${crypto.randomBytes(3).toString('hex')}`;
    this.logDir = path.join(this.stateRoot, 'logs', this.runId);
    this.reportDir = path.join(this.stateRoot, 'reports');
    this.checkpointDir = path.join(this.stateRoot, 'checkpoints');
    this.runLog = path.join(this.logDir, 'run.log');
    this.startMs = Date.now();
    this.lockOwned = false;
    this.interrupted = false;
    this.currentChild = null;
    this.state = null;
  }

  log(event, fields = {}, level = 'info', jobLog = null) {
    const record = { timestamp: now(), level, event, ...fields };
    const line = `${JSON.stringify(record)}\n`;
    fs.mkdirSync(this.logDir, { recursive: true });
    fs.appendFileSync(this.runLog, line);
    if (jobLog) fs.appendFileSync(jobLog, line);
    if (this.options.logLevel === 'debug' || level !== 'debug') {
      process.stdout.write(`${record.timestamp} ${event}${fields.command ? ` command=${JSON.stringify(fields.command)}` : ''}${fields.exit_code !== undefined ? ` exit=${fields.exit_code}` : ''}\n`);
    }
  }

  saveState() {
    this.state.updated_at = now();
    this.state.current_head = git(this.root, ['rev-parse', 'HEAD']).stdout.trim();
    this.state.duration_ms = duration(this.startMs);
    atomicJson(this.stateFile, this.state);
  }

  acquireLock() {
    fs.mkdirSync(this.stateRoot, { recursive: true });
    if (fs.existsSync(this.lockDir)) {
      let lock = {};
      try { lock = JSON.parse(fs.readFileSync(path.join(this.lockDir, 'owner.json'), 'utf8')); } catch {}
      let active = false;
      if (Number.isInteger(lock.pid) && lock.pid > 1) {
        try { process.kill(lock.pid, 0); active = true; } catch {}
      }
      if (active) throw Object.assign(new Error(`ACTIVE_LOCK:pid=${lock.pid}:run_id=${lock.run_id ?? 'unknown'}`), { exitCode: EXIT.LOCKED });
      const stale = `${this.lockDir}.stale-${Date.now()}-${process.pid}`;
      fs.renameSync(this.lockDir, stale);
      this.log('STALE_LOCK_RECOVERED', { prior_pid: lock.pid ?? null, archived_at: stale }, 'warn');
    }
    fs.mkdirSync(this.lockDir);
    atomicJson(path.join(this.lockDir, 'owner.json'), {
      schema_version: 1, pid: process.pid, timestamp: now(),
      branch: git(this.root, ['branch', '--show-current']).stdout.trim(), run_id: this.runId
    });
    this.lockOwned = true;
  }

  releaseLock() {
    if (!this.lockOwned) return;
    try {
      const owner = JSON.parse(fs.readFileSync(path.join(this.lockDir, 'owner.json'), 'utf8'));
      if (owner.pid === process.pid && owner.run_id === this.runId) fs.rmSync(this.lockDir, { recursive: true });
    } catch {}
    this.lockOwned = false;
  }

  validateGit() {
    if (git(this.root, ['rev-parse', '--is-inside-work-tree'], { allowFailure: true }).stdout.trim() !== 'true') {
      throw new Error('NOT_A_GIT_REPOSITORY');
    }
    const branch = git(this.root, ['branch', '--show-current']).stdout.trim();
    if (!branch) throw new Error('DETACHED_HEAD_REFUSED');
    if (branch === 'main') throw new Error('MAIN_BRANCH_REFUSED');
    const dirty = changedPaths(this.root);
    if (dirty.length) throw new Error(`DIRTY_WORKTREE:${dirty.join(',')}`);
    const upstream = git(this.root, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'], { allowFailure: true });
    if (upstream.status === 0) {
      const expected = `origin/${branch}`;
      if (upstream.stdout.trim() !== expected) throw new Error(`UPSTREAM_BRANCH_MISMATCH:${upstream.stdout.trim()}:${expected}`);
    } else if (this.options.push) throw new Error('UPSTREAM_REQUIRED_WHEN_PUSH_ENABLED');
    return branch;
  }

  initialState(branch, head) {
    return {
      schema_version: 2, run_id: this.runId, status: 'RUNNING', result: null,
      started_at: now(), finished_at: null, branch, start_head: head, current_head: head,
      queue_path: path.relative(this.root, this.options.queuePath), queue_hash: this.queueHash,
      current_job: null, current_step: null, completed_jobs: [], no_change_jobs: [],
      skipped_jobs: [], blocked_jobs: [], failed_job: null, failed_step: null,
      failure_reason: null, attempts: {}, duration_ms: 0, commits: [], pushes: [],
      jobs: Object.fromEntries(this.queue.jobs.map(job => [job.id, {
        status: job.status === 'DISABLED' ? 'DISABLED' : 'NOT_STARTED',
        content_hash: queueJobHash(job), attempts: 0, checkpoint_head: null,
        started_at: null, finished_at: null, result: null
      }]))
    };
  }

  initialize(branch, head) {
    if (this.options.restart && fs.existsSync(this.stateFile)) {
      fs.mkdirSync(path.join(this.stateRoot, 'reports'), { recursive: true });
      fs.renameSync(this.stateFile, path.join(this.stateRoot, 'reports', `state-restarted-${Date.now()}.json`));
    }
    if (this.options.resume) {
      if (!fs.existsSync(this.stateFile)) throw new Error('RESUME_STATE_NOT_FOUND');
      this.state = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      if (this.state.branch !== branch) throw new Error(`RESUME_BRANCH_DIVERGED:${this.state.branch}:${branch}`);
      if (this.state.queue_hash !== this.queueHash) throw new Error('RESUME_QUEUE_DIVERGED');
      for (const job of this.queue.jobs) {
        if (this.state.jobs?.[job.id]?.content_hash !== queueJobHash(job)) throw new Error(`RESUME_JOB_DIVERGED:${job.id}`);
      }
      if (this.state.current_head !== head) throw new Error(`RESUME_HEAD_DIVERGED:${this.state.current_head}:${head}`);
      this.state.run_id = this.runId;
      this.state.status = 'RUNNING';
      this.state.result = null;
      this.state.finished_at = null;
      if (this.state.current_job && this.state.jobs[this.state.current_job]?.status === 'RUNNING') {
        this.state.jobs[this.state.current_job].status = 'INTERRUPTED';
      }
    } else {
      if (fs.existsSync(this.stateFile) && !this.options.restart) {
        const prior = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
        if (prior.status === 'RUNNING' || prior.result === 'INTERRUPTED') {
          throw new Error('UNFINISHED_STATE_EXISTS_USE_RESUME_OR_RESTART');
        }
      }
      this.state = this.initialState(branch, head);
    }
    this.saveState();
  }

  selectJobs() {
    let jobs = this.queue.jobs;
    if (this.options.job) {
      const selected = jobs.find(job => job.id === this.options.job);
      if (!selected) throw new Error(`JOB_NOT_FOUND:${this.options.job}`);
      jobs = [selected];
    } else if (this.options.from) {
      const index = jobs.findIndex(job => job.id === this.options.from);
      if (index < 0) throw new Error(`FROM_JOB_NOT_FOUND:${this.options.from}`);
      jobs = jobs.slice(index);
    }
    if (this.options.stopAfter) {
      const index = jobs.findIndex(job => job.id === this.options.stopAfter);
      if (index < 0) throw new Error(`STOP_AFTER_JOB_NOT_FOUND:${this.options.stopAfter}`);
      jobs = jobs.slice(0, index + 1);
    }
    return jobs;
  }

  async execute(step, commandSpec, jobLog, kind) {
    const started = Date.now();
    this.state.current_step = step;
    this.saveState();
    this.log('STEP_START', { step, kind, command: commandSpec.command, timeout_seconds: commandSpec.timeout_seconds }, 'info', jobLog);
    const child = spawn('bash', ['-lc', commandSpec.command], {
      cwd: this.root, stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, CI: process.env.CI || '1' }, detached: true
    });
    this.currentChild = child;
    child.stdout.on('data', chunk => {
      fs.appendFileSync(jobLog || this.runLog, chunk);
      if (jobLog) fs.appendFileSync(this.runLog, chunk);
    });
    child.stderr.on('data', chunk => {
      fs.appendFileSync(jobLog || this.runLog, chunk);
      if (jobLog) fs.appendFileSync(this.runLog, chunk);
    });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try { process.kill(-child.pid, 'SIGTERM'); } catch {}
      setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }, 1000).unref();
    }, commandSpec.timeout_seconds * 1000);
    const outcome = await new Promise(resolve => {
      child.on('error', error => resolve({ code: 127, signal: null, error: error.message }));
      child.on('close', (code, signal) => resolve({ code: code ?? (signal ? 128 + (os.constants.signals[signal] || 0) : 1), signal }));
    });
    clearTimeout(timer);
    this.currentChild = null;
    const result = { ...outcome, timed_out: timedOut, duration_ms: duration(started) };
    this.log('STEP_END', {
      step, kind, command: commandSpec.command, exit_code: result.code,
      signal: result.signal, timed_out: timedOut, duration_ms: result.duration_ms
    }, commandSpec.allowed_exit_codes.includes(result.code) && !timedOut ? 'info' : 'error', jobLog);
    return result;
  }

  stopCurrentChild(signal = 'SIGTERM') {
    if (!this.currentChild?.pid) return;
    try { process.kill(-this.currentChild.pid, signal); } catch {}
    this.currentChild = null;
  }

  async rollback(job, checkpoint, beforeUntracked) {
    const paths = changedPaths(this.root);
    assertPathScope(paths, job.allowed_changed_paths, job.forbidden_changed_paths, 'ROLLBACK');
    for (const candidate of paths) {
      const absolute = path.join(this.root, candidate);
      const trackedAtCheckpoint = git(this.root, ['cat-file', '-e', `${checkpoint}:${candidate}`], { allowFailure: true }).status === 0;
      if (trackedAtCheckpoint) {
        git(this.root, ['restore', '--source', checkpoint, '--staged', '--worktree', '--', candidate]);
      } else if (!beforeUntracked.has(candidate) && fs.existsSync(absolute)) {
        fs.rmSync(absolute, { recursive: true, force: true });
      }
    }
    const remaining = changedPaths(this.root);
    if (remaining.length) throw new Error(`ROLLBACK_INCOMPLETE_OR_PREEXISTING:${remaining.join(',')}`);
    this.log('ROLLBACK_COMPLETE', { job: job.id, checkpoint, restored_paths: paths });
  }

  async runRepairs(job, exitCode, jobLog) {
    for (const repair of job.repairs) {
      if (!repair.when_exit_codes.includes(exitCode)) continue;
      for (let attempt = 1; attempt <= repair.attempt_limit; attempt += 1) {
        const result = await this.execute(
          `repair:${job.id}:${attempt}`,
          { command: repair.command, timeout_seconds: repair.timeout_seconds, allowed_exit_codes: [0] },
          jobLog, 'repair'
        );
        assertPathScope(changedPaths(this.root), repair.allowed_changed_paths, job.forbidden_changed_paths, 'REPAIR');
        if (result.code !== 0 || result.timed_out) continue;
        let verified = true;
        for (const [index, verification] of repair.verify.entries()) {
          const check = await this.execute(`repair-verify:${job.id}:${index + 1}`, verification, jobLog, 'repair_verify');
          if (check.timed_out || !verification.allowed_exit_codes.includes(check.code)) { verified = false; break; }
        }
        if (verified) return true;
      }
      return false;
    }
    return false;
  }

  checkpoint(job, head, beforeUntracked) {
    const checkpoint = {
      schema_version: 1, run_id: this.runId, job_id: job.id, job_hash: queueJobHash(job),
      queue_hash: this.queueHash, branch: this.state.branch, head,
      untracked_before: [...beforeUntracked], created_at: now()
    };
    atomicJson(path.join(this.checkpointDir, `${job.id}.json`), checkpoint);
  }

  async runJob(job) {
    const jobState = this.state.jobs[job.id];
    if (job.status === 'DISABLED') {
      jobState.status = 'DISABLED';
      this.state.skipped_jobs.push(job.id);
      this.saveState();
      return;
    }
    if (['PASS_NO_CHANGES', 'PASS_COMMITTED'].includes(jobState.result)) {
      this.state.skipped_jobs.push(job.id);
      this.log('JOB_SKIPPED_COMPLETED', { job: job.id });
      return;
    }
    const unmet = job.depends_on.filter(id => !['PASS_NO_CHANGES', 'PASS_COMMITTED'].includes(this.state.jobs[id]?.result));
    if (unmet.length) {
      jobState.status = 'BLOCKED_DEPENDENCY';
      jobState.result = 'BLOCKED_DEPENDENCY';
      this.state.blocked_jobs.push(job.id);
      this.state.skipped_jobs.push(job.id);
      this.saveState();
      this.log('JOB_BLOCKED_DEPENDENCY', { job: job.id, unmet });
      return;
    }

    const jobLog = path.join(this.logDir, `job-${job.id}.log`);
    fs.writeFileSync(jobLog, '');
    const checkpointHead = git(this.root, ['rev-parse', 'HEAD']).stdout.trim();
    const beforeUntracked = new Set(git(this.root, ['ls-files', '--others', '--exclude-standard', '-z']).stdout.split('\0').filter(Boolean));
    this.checkpoint(job, checkpointHead, beforeUntracked);
    Object.assign(jobState, {
      status: 'RUNNING', result: null, checkpoint_head: checkpointHead,
      started_at: now(), finished_at: null
    });
    this.state.current_job = job.id;
    this.saveState();
    this.log('JOB_START', { job: job.id, title: job.title, checkpoint_head: checkpointHead }, 'info', jobLog);

    try {
      let passed = false;
      for (let attempt = 1; attempt <= job.retry_limit + 1 && !passed; attempt += 1) {
        jobState.attempts = attempt;
        this.state.attempts[job.id] = attempt;
        this.saveState();
        passed = true;
        for (const [index, command] of job.commands.entries()) {
          const result = await this.execute(`command:${job.id}:${index + 1}`, command, jobLog, 'command');
          if (result.timed_out || !command.allowed_exit_codes.includes(result.code)) {
            passed = false;
            if (result.timed_out) throw new Error(`COMMAND_TIMEOUT:${index + 1}`);
            if (attempt <= job.retry_limit && await this.runRepairs(job, result.code, jobLog)) break;
            throw new Error(`COMMAND_FAILED:${index + 1}:exit=${result.code}${result.signal ? `:signal=${result.signal}` : ''}`);
          }
        }
      }

      for (const [index, verification] of job.verify.entries()) {
        const result = await this.execute(`verify:${job.id}:${index + 1}`, verification, jobLog, 'verify');
        if (result.timed_out) throw new Error(`VERIFY_TIMEOUT:${index + 1}`);
        if (!verification.allowed_exit_codes.includes(result.code)) throw new Error(`VERIFY_FAILED:${index + 1}:exit=${result.code}`);
      }

      let paths = changedPaths(this.root);
      assertPathScope(paths, job.allowed_changed_paths, job.forbidden_changed_paths, 'JOB');
      if (paths.length === 0) {
        jobState.status = 'COMPLETED_NO_CHANGES';
        jobState.result = 'PASS_NO_CHANGES';
        jobState.finished_at = now();
        this.state.completed_jobs.push(job.id);
        this.state.no_change_jobs.push(job.id);
        this.log('JOB_END', { job: job.id, result: 'PASS_NO_CHANGES' }, 'info', jobLog);
        this.saveState();
        return;
      }

      const diffCheck = await this.execute(`scope:git-diff-check:${job.id}`, {
        command: 'git diff --check', timeout_seconds: job.timeout_seconds, allowed_exit_codes: [0]
      }, jobLog, 'scope_gate');
      if (diffCheck.code !== 0 || diffCheck.timed_out) throw new Error('GIT_DIFF_CHECK_FAILED');

      for (const [index, gate] of this.queue.global_gates.entries()) {
        const result = await this.execute(`global-gate:${index + 1}`, gate, jobLog, 'global_gate');
        if (result.timed_out) throw new Error(`GLOBAL_GATE_TIMEOUT:${index + 1}`);
        if (!gate.allowed_exit_codes.includes(result.code)) throw new Error(`GLOBAL_GATE_FAILED:${index + 1}:exit=${result.code}`);
      }

      paths = changedPaths(this.root);
      assertPathScope(paths, job.allowed_changed_paths, job.forbidden_changed_paths, 'PRE_COMMIT');
      git(this.root, ['add', '--', ...paths]);
      const staged = git(this.root, ['diff', '--cached', '--name-only', '-z']).stdout.split('\0').filter(Boolean);
      assertPathScope(staged, job.allowed_changed_paths, job.forbidden_changed_paths, 'STAGED');
      if (!staged.length) throw new Error('NO_STAGED_PATHS_AFTER_CHANGES');
      git(this.root, ['commit', '-m', job.commit_message], { inherit: true });
      const commit = git(this.root, ['rev-parse', 'HEAD']).stdout.trim();
      this.state.commits.push({ job_id: job.id, sha: commit, message: job.commit_message, created_at: now() });
      jobState.status = 'COMPLETED_COMMITTED';
      jobState.result = 'PASS_COMMITTED';
      jobState.commit = commit;
      this.saveState();

      if (job.push && this.options.push) {
        const push = git(this.root, ['push', 'origin', this.state.branch], { allowFailure: true });
        if (push.status !== 0) {
          jobState.status = 'COMPLETED_COMMIT_PUSH_FAILED';
          jobState.result = 'PASS_COMMIT_PUSH_FAILED';
          this.state.failure_reason = `PUSH_FAILED:${(push.stderr || '').trim()}`;
          this.state.failed_job = job.id;
          this.state.failed_step = 'push';
          this.saveState();
          throw Object.assign(new Error(this.state.failure_reason), { preserveCommit: true });
        }
        this.state.pushes.push({ job_id: job.id, sha: commit, remote: 'origin', branch: this.state.branch, completed_at: now() });
      }
      const remaining = changedPaths(this.root);
      if (remaining.length) throw new Error(`DIRTY_AFTER_COMMIT:${remaining.join(',')}`);
      jobState.finished_at = now();
      this.state.completed_jobs.push(job.id);
      this.log('JOB_END', { job: job.id, result: jobState.result, commit }, 'info', jobLog);
      this.saveState();
    } catch (error) {
      if (!error.preserveCommit) await this.rollback(job, checkpointHead, beforeUntracked);
      if (jobState.result !== 'PASS_COMMIT_PUSH_FAILED') {
        jobState.status = 'FAILED';
        jobState.result = 'FAILED';
      }
      jobState.finished_at = now();
      this.state.failed_job = job.id;
      this.state.failed_step = this.state.current_step;
      this.state.failure_reason = error.message;
      this.saveState();
      throw error;
    }
  }

  report(result) {
    this.state.status = result === 'PASS' ? 'COMPLETE' : result === 'INTERRUPTED' ? 'INTERRUPTED' : 'FAILED';
    this.state.result = result;
    this.state.finished_at = now();
    this.state.current_head = git(this.root, ['rev-parse', 'HEAD']).stdout.trim();
    this.state.duration_ms = duration(this.startMs);
    atomicJson(this.stateFile, this.state);
    const reportFile = path.join(this.reportDir, `report-${this.runId}.json`);
    const summaryFile = path.join(this.reportDir, `summary-${this.runId}.txt`);
    const lines = [
      `OVERNIGHT_STATUS=${result}`, `RUN_ID=${this.runId}`, `BRANCH=${this.state.branch}`,
      `START_HEAD=${this.state.start_head}`, `FINAL_HEAD=${this.state.current_head}`,
      `JOBS_TOTAL=${this.queue.jobs.length}`, `JOBS_COMPLETED=${this.state.completed_jobs.length}`,
      `JOBS_NO_CHANGES=${this.state.no_change_jobs.length}`, `JOBS_SKIPPED=${this.state.skipped_jobs.length}`,
      `JOBS_FAILED=${this.state.failed_job ? 1 : 0}`, `COMMITS_CREATED=${this.state.commits.length}`,
      `PUSHES_COMPLETED=${this.state.pushes.length}`, `FAILED_JOB=${this.state.failed_job ?? ''}`,
      `FAILED_STEP=${this.state.failed_step ?? ''}`, `FAIL_REASON=${this.state.failure_reason ?? ''}`,
      `ELAPSED=${elapsedText(this.state.duration_ms)}`, `LOG_DIRECTORY=${this.logDir}`,
      `REPORT_FILE=${reportFile}`
    ];
    atomicJson(reportFile, this.state);
    atomicText(summaryFile, `${lines.join('\n')}\n`);
    process.stdout.write(`${lines.join('\n')}\n`);
    if (process.env.FORGE_OVERNIGHT_DETECTED_PLATFORM === 'termux' &&
        process.env.FORGE_OVERNIGHT_COPY_SUMMARY === '1') {
      const clipboard = spawnSync('termux-clipboard-set', [], { input: `${lines.join('\n')}\n`, encoding: 'utf8' });
      this.log('CLIPBOARD_RESULT', { exit_code: clipboard.status ?? 127 }, clipboard.status === 0 ? 'info' : 'warn');
    }
  }
}

async function main() {
  let options;
  try { options = parseArgs(process.argv.slice(2)); }
  catch (error) { console.error(`${error.message}\n${help}`); process.exit(EXIT.CONFIG); }
  if (options.help) { process.stdout.write(help); return; }
  const root = path.resolve(options.repo);
  options.queuePath = path.isAbsolute(options.queue) ? options.queue : path.join(root, options.queue);
  let queue;
  let queueBytes;
  try {
    queueBytes = fs.readFileSync(options.queuePath);
    queue = loadAndValidateQueue(options.queuePath);
  } catch (error) {
    console.error(`OVERNIGHT_STATUS=FAILED\nFAIL_REASON=${error.message}`);
    process.exit(EXIT.CONFIG);
  }
  if (options.dryRun) {
    process.stdout.write(`DRY_RUN=PASS\nREPO=${root}\nQUEUE=${options.queuePath}\nPLATFORM=${process.env.FORGE_OVERNIGHT_DETECTED_PLATFORM || 'unknown'}\n`);
    for (const job of queue.jobs) {
      process.stdout.write(`JOB=${job.id} STATUS=${job.status} DEPENDS_ON=${job.depends_on.join(',')}\n`);
      for (const item of job.commands) process.stdout.write(`COMMAND=${item.command}\n`);
      for (const item of job.verify) process.stdout.write(`VERIFY=${item.command}\n`);
      process.stdout.write(`ALLOWED_CHANGED_PATHS=${job.allowed_changed_paths.join(',')}\n`);
    }
    for (const gate of queue.global_gates) process.stdout.write(`GLOBAL_GATE=${gate.command}\n`);
    return;
  }

  const runner = new Runner(options, queue, queueBytes);
  const onSignal = signal => {
    if (runner.interrupted) return;
    runner.interrupted = true;
    runner.stopCurrentChild('SIGTERM');
    if (runner.state) {
      runner.state.status = 'INTERRUPTED';
      runner.state.result = 'INTERRUPTED';
      runner.state.failure_reason = `USER_SIGNAL:${signal}`;
      runner.state.failed_step = runner.state.current_step;
      runner.saveState();
    }
    runner.releaseLock();
    process.exit(signal === 'SIGHUP' ? 129 : signal === 'SIGTERM' ? 143 : 130);
  };
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => onSignal(signal));

  let result = 'FAILED';
  let exitCode = EXIT.FAILED;
  try {
    const branch = runner.validateGit();
    runner.acquireLock();
    runner.log('CAPABILITIES', {
      platform: process.env.FORGE_OVERNIGHT_DETECTED_PLATFORM || 'unknown',
      wake_lock: process.env.FORGE_OVERNIGHT_DETECTED_PLATFORM === 'termux' && Boolean(process.env.TERMUX_VERSION),
      clipboard: process.env.FORGE_OVERNIGHT_DETECTED_PLATFORM === 'termux',
      timeout: true, ansi: Boolean(process.stdout.isTTY), symlinks: true, gnu_coreutils: true,
      ssh: Boolean(process.env.SSH_CONNECTION), tty: Boolean(process.stdout.isTTY)
    });
    if (!options.skipFetch) git(root, ['fetch', '--prune', 'origin']);
    const head = git(root, ['rev-parse', 'HEAD']).stdout.trim();
    runner.initialize(branch, head);
    let count = 0;
    for (const job of runner.selectJobs()) {
      if (count >= options.maxJobs) break;
      await runner.runJob(job);
      if (job.status !== 'DISABLED') count += 1;
    }
    if (runner.state.blocked_jobs.length) throw new Error(`BLOCKED_DEPENDENCIES:${runner.state.blocked_jobs.join(',')}`);
    result = 'PASS';
    exitCode = 0;
  } catch (error) {
    if (runner.state) {
      runner.state.failure_reason ||= error.message;
      runner.state.failed_step ||= runner.state.current_step || 'bootstrap';
    }
    console.error(`RUNNER_ERROR=${error.message}`);
    exitCode = error.exitCode || EXIT.FAILED;
  } finally {
    if (runner.state) runner.report(result);
    runner.releaseLock();
  }
  process.exit(exitCode);
}

await main();
