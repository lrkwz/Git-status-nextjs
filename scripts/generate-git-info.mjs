import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const CWD = process.cwd();

function runGit(cmd) {
  try {
    return execSync(`git ${cmd}`, {
      cwd: CWD,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000,
    }).trim();
  } catch {
    return '';
  }
}

function runGitRaw(cmd) {
  try {
    return execSync(`git ${cmd}`, {
      cwd: CWD,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000,
    });
  } catch {
    return '';
  }
}

export function generateGitInfo() {
  const buildTime = new Date().toISOString();

  // Verifica se è un git repository
  const isInsideWorkTree = runGit('rev-parse --is-inside-work-tree') === 'true';

  let gitVersion = runGit('--version');
  let currentBranch = 'N/A';
  let latestTag = null;
  let isDirty = false;
  let dirtyFilesCount = 0;
  let dirtyFiles = [];
  let latestCommit = null;
  let recentCommits = [];
  let stats = {
    totalCommits: 0,
    totalTags: 0,
    totalBranches: 0,
    allBranches: [],
    allTags: [],
  };

  if (isInsideWorkTree) {
    // 1. Branch Corrente
    currentBranch = runGit('branch --show-current');
    if (!currentBranch) {
      const detachedHead = runGit('rev-parse --short HEAD');
      currentBranch = detachedHead ? `detached (${detachedHead})` : 'HEAD sconosciuto';
    }

    // 2. Ultimo Tag
    const describeTag = runGit('describe --tags --abbrev=0');
    if (describeTag) {
      latestTag = describeTag;
    } else {
      const allTagsSorted = runGit('tag --sort=-creatordate')
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean);
      if (allTagsSorted.length > 0) {
        latestTag = allTagsSorted[0];
      }
    }

    // 3. Verifica stato Dirty alla build
    const statusOutput = runGitRaw('status --porcelain=v1');
    if (statusOutput) {
      const lines = statusOutput.split('\n').filter((l) => l.length > 0);
      for (const line of lines) {
        const match = line.match(/^([ MADRCU?!]{2})\s+(.+)$/);
        if (match) {
          const fullStatus = match[1];
          const statusCode = fullStatus.trim() || fullStatus;
          const filePath = match[2].trim();
          
          // Ignora il file json generato da questo script per non falsificare lo stato dirty
          if (filePath === 'lib/git-info.json' || filePath.endsWith('/git-info.json')) {
            continue;
          }

          const indexCode = fullStatus[0];
          const staged = indexCode !== ' ' && indexCode !== '?';

          dirtyFiles.push({
            status: statusCode,
            path: filePath,
            staged,
          });
        }
      }
    }
    isDirty = dirtyFiles.length > 0;
    dirtyFilesCount = dirtyFiles.length;

    // 4. Hash dell'ultima commit e dettagli
    const latestCommitRaw = runGit('log -1 --format="%H|%h|%s|%an|%ae|%aI|%cr"');
    if (latestCommitRaw) {
      const [hash, shortHash, subject, author, authorEmail, date, relativeDate] =
        latestCommitRaw.split('|');
      if (hash) {
        latestCommit = {
          hash,
          shortHash: shortHash || hash.substring(0, 7),
          subject: subject || 'Nessun messaggio',
          author: author || 'Anonimo',
          authorEmail: authorEmail || '',
          date: date || buildTime,
          relativeDate: relativeDate || '',
        };
      }
    }

    // Cronologia recente commit (ultimi 5)
    const recentRaw = runGit('log -5 --format="%H|%h|%s|%an|%ae|%aI|%cr"');
    if (recentRaw) {
      const rows = recentRaw.split('\n').filter((r) => r.trim().length > 0);
      for (const row of rows) {
        const [hash, shortHash, subject, author, authorEmail, date, relativeDate] =
          row.split('|');
        if (hash) {
          recentCommits.push({
            hash,
            shortHash: shortHash || hash.substring(0, 7),
            subject: subject || 'Nessun messaggio',
            author: author || 'Anonimo',
            authorEmail: authorEmail || '',
            date: date || buildTime,
            relativeDate: relativeDate || '',
          });
        }
      }
    }

    // Statistiche repository
    const commitCountStr = runGit('rev-list --count HEAD');
    if (commitCountStr && !isNaN(Number(commitCountStr))) {
      stats.totalCommits = Number(commitCountStr);
    }

    stats.allBranches = runGit('branch --format="%(refname:short)"')
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean);

    stats.allTags = runGit('tag -l')
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);

    stats.totalBranches = stats.allBranches.length;
    stats.totalTags = stats.allTags.length;
  }

  const gitData = {
    isGitRepo: isInsideWorkTree,
    gitVersion,
    currentBranch,
    latestTag,
    isDirty,
    dirtyFilesCount,
    dirtyFiles,
    latestCommit,
    recentCommits,
    stats,
    buildTime,
    collectedAt: 'build-time',
  };

  const outputDir = path.join(CWD, 'lib');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'git-info.json');
  fs.writeFileSync(outputPath, JSON.stringify(gitData, null, 2), 'utf8');
  console.log(`[build-time] Git info salvate con successo in ${outputPath}`);

  return gitData;
}

// Esegui se chiamato direttamente
if (process.argv[1] && process.argv[1].endsWith('generate-git-info.mjs')) {
  generateGitInfo();
}
