import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const CWD = process.cwd();

function runGit(command) {
  try {
    return execSync(`git ${command}`, {
      cwd: CWD,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000,
    }).trim();
  } catch {
    return '';
  }
}

function runGitRaw(command) {
  try {
    return execSync(`git ${command}`, {
      cwd: CWD,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000,
    });
  } catch {
    return '';
  }
}

export function getGitInfo() {
  const lastChecked = new Date().toISOString();

  // Verifica se git è installato
  let gitVersion = '';
  try {
    gitVersion = runGit('--version');
  } catch (err) {
    return {
      isGitRepo: false,
      gitVersion: 'Non disponibile',
      currentBranch: 'N/A',
      latestTag: null,
      isDirty: false,
      dirtyFilesCount: 0,
      dirtyFiles: [],
      latestCommit: null,
      recentCommits: [],
      stats: {
        totalCommits: 0,
        totalTags: 0,
        totalBranches: 0,
        allBranches: [],
        allTags: [],
      },
      lastChecked,
      error: `Git non è accessibile: ${err?.message || err}`,
    };
  }

  // Verifica se la directory corrente è all'interno di un repository Git
  const isInsideWorkTree = runGit('rev-parse --is-inside-work-tree') === 'true';

  if (!isInsideWorkTree) {
    return {
      isGitRepo: false,
      gitVersion,
      currentBranch: 'N/A',
      latestTag: null,
      isDirty: false,
      dirtyFilesCount: 0,
      dirtyFiles: [],
      latestCommit: null,
      recentCommits: [],
      stats: {
        totalCommits: 0,
        totalTags: 0,
        totalBranches: 0,
        allBranches: [],
        allTags: [],
      },
      lastChecked,
      error: 'La directory corrente non è un repository Git inizializzato.',
    };
  }

  // 1. Branch Corrente
  let currentBranch = runGit('branch --show-current');
  if (!currentBranch) {
    const detachedHead = runGit('rev-parse --short HEAD');
    currentBranch = detachedHead ? `detached (${detachedHead})` : 'HEAD sconosciuto';
  }

  // 2. Ultimo Tag
  let latestTag = null;
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

  // 3. Verifica stato Dirty (file modificati, aggiunti, eliminati, non tracciati)
  const statusOutput = runGitRaw('status --porcelain=v1');
  const dirtyFiles = [];

  if (statusOutput) {
    const lines = statusOutput.split('\n').filter((l) => l.length > 0);
    for (const line of lines) {
      // Porcelain v1: I primi 2 caratteri rappresentano lo status (X e Y), seguiti da uno spazio e il path
      const match = line.match(/^([ MADRCU?!]{2})\s+(.+)$/);
      if (match) {
        const fullStatus = match[1];
        const statusCode = fullStatus.trim() || fullStatus;
        const filePath = match[2].trim();
        const indexCode = fullStatus[0];
        const staged = indexCode !== ' ' && indexCode !== '?';

        dirtyFiles.push({
          status: statusCode,
          path: filePath,
          staged,
        });
      } else if (line.trim().length > 0) {
        dirtyFiles.push({
          status: 'M',
          path: line.trim(),
          staged: false,
        });
      }
    }
  }

  const isDirty = dirtyFiles.length > 0;
  const dirtyFilesCount = dirtyFiles.length;

  // 4. Hash dell'ultima commit e dettagli
  let latestCommit = null;
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
        date: date || new Date().toISOString(),
        relativeDate: relativeDate || '',
      };
    }
  }

  // Cronologia recente commit (ultimi 5)
  const recentCommits = [];
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
          date: date || new Date().toISOString(),
          relativeDate: relativeDate || '',
        });
      }
    }
  }

  // Statistiche repository
  let totalCommits = 0;
  const commitCountStr = runGit('rev-list --count HEAD');
  if (commitCountStr && !isNaN(Number(commitCountStr))) {
    totalCommits = Number(commitCountStr);
  }

  const allBranches = runGit('branch --format="%(refname:short)"')
    .split('\n')
    .map((b) => b.trim())
    .filter(Boolean);

  const allTags = runGit('tag -l')
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean);

  return {
    isGitRepo: true,
    gitVersion,
    currentBranch,
    latestTag,
    isDirty,
    dirtyFilesCount,
    dirtyFiles,
    latestCommit,
    recentCommits,
    stats: {
      totalCommits,
      totalTags: allTags.length,
      totalBranches: allBranches.length,
      allBranches,
      allTags,
    },
    lastChecked,
  };
}

export function executeGitAction(action, payload = {}) {
  try {
    if (action === 'init-repo') {
      execSync('git init -b main', { cwd: CWD });
      execSync('git config user.name "AI Studio"', { cwd: CWD });
      execSync('git config user.email "developer@example.com"', { cwd: CWD });
      execSync('git add .', { cwd: CWD });
      execSync('git commit -m "feat: initial commit"', { cwd: CWD });
      execSync('git tag -a v1.0.0 -m "Release v1.0.0"', { cwd: CWD });
      return { success: true, message: 'Repository Git inizializzato con successo.' };
    }

    if (action === 'toggle-dirty') {
      const testFilePath = path.join(CWD, 'test-dirty-file.tmp');
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
        return { success: true, message: 'File di test rimosso. Repository ripristinato a stato pulito (Clean).' };
      } else {
        const timestamp = new Date().toISOString();
        fs.writeFileSync(
          testFilePath,
          `File temporaneo creato per testare lo stato DIRTY alle ${timestamp}\n`
        );
        return { success: true, message: 'Creato file non tracciato: "test-dirty-file.tmp". Repository ora DIRTY.' };
      }
    }

    if (action === 'clean-dirty') {
      const testFilePath = path.join(CWD, 'test-dirty-file.tmp');
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
      try {
        execSync('git checkout -- .', { cwd: CWD });
      } catch {}
      try {
        execSync('git clean -fd', { cwd: CWD });
      } catch {}
      return { success: true, message: 'Working tree pulito con successo. Repository ora CLEAN.' };
    }

    if (action === 'create-tag') {
      const tagName = (payload.name || '').trim();
      if (!tagName) {
        return { success: false, message: 'Nome tag richiesto (es. v1.0.1).' };
      }
      if (!/^[a-zA-Z0-9._\-/]+$/.test(tagName)) {
        return { success: false, message: 'Nome tag non valido.' };
      }
      const tagMessage = payload.message || `Tag ${tagName}`;
      execSync(`git tag -a "${tagName}" -m "${tagMessage.replace(/"/g, '\\"')}"`, { cwd: CWD });
      return { success: true, message: `Tag "${tagName}" creato con successo.` };
    }

    if (action === 'create-commit') {
      const commitMsg = (payload.message || 'chore: test commit').trim();
      const dummyPath = path.join(CWD, '.git-activity.log');
      const timestamp = new Date().toISOString();
      fs.appendFileSync(dummyPath, `Commit creato il ${timestamp}\n`);
      execSync('git add .git-activity.log', { cwd: CWD });
      execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { cwd: CWD });
      return { success: true, message: `Nuovo commit creato: "${commitMsg}".` };
    }

    if (action === 'switch-branch') {
      const branchName = (payload.name || '').trim();
      if (!branchName) {
        return { success: false, message: 'Nome del branch richiesto.' };
      }
      if (!/^[a-zA-Z0-9._\-/]+$/.test(branchName)) {
        return { success: false, message: 'Nome branch non valido.' };
      }
      try {
        execSync(`git checkout "${branchName}" 2>/dev/null || git checkout -b "${branchName}"`, {
          cwd: CWD,
          shell: '/bin/bash',
        });
        return { success: true, message: `Passato al branch "${branchName}".` };
      } catch (err) {
        return { success: false, message: `Errore durante il cambio branch: ${err?.message || err}` };
      }
    }

    return { success: false, message: 'Azione non riconosciuta.' };
  } catch (err) {
    return { success: false, message: `Errore: ${err?.message || err}` };
  }
}
