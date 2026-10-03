'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  GitBranch,
  Tag,
  GitCommit,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Terminal,
  FolderGit2,
  Clock,
  User,
  FileCode,
  ShieldCheck,
  Cpu,
  Layers,
  UploadCloud,
} from 'lucide-react';

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function GitDashboard({ gitInfo }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [showRemoteHelp, setShowRemoteHelp] = useState(false);
  const isClient = useIsClient();

  const data = gitInfo || {
    isGitRepo: false,
    gitVersion: '',
    currentBranch: 'main',
    latestTag: null,
    isDirty: false,
    dirtyFilesCount: 0,
    dirtyFiles: [],
    latestCommit: null,
    recentCommits: [],
    stats: { totalCommits: 0, totalTags: 0, totalBranches: 0, allBranches: [], allTags: [] },
    buildTime: '',
    collectedAt: 'build-time',
  };

  const handleCopy = async (text, key) => {
    if (!text) return;
    let copied = false;

    // 1. Prova con Clipboard API moderna
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch {
        // Fallback sotto
      }
    }

    // 2. Fallback per iframe / contesti privi di permessi Clipboard API
    if (!copied && typeof document !== 'undefined') {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        copied = true;
      } catch {
        // Ignora se non permesso
      }
    }

    if (copied) {
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    }
  };

  // Formattazione deterministica per prevenire Hydration Mismatch tra Server e Client
  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '--:--';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    // Durante SSR e prima del mounting usiamo formato ISO UTC deterministico
    if (!isClient) {
      return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    }

    // Dopo l'idratazione sul client possiamo usare la localizzazione del browser dell'utente
    try {
      return date.toLocaleString('it-IT', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      });
    } catch {
      return date.toISOString().replace('T', ' ').substring(0, 19);
    }
  };

  const formattedBuildTime = formatTimestamp(data.buildTime);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Bar Contract (3 zone standard) */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Zona 1: Brand wordmark singolo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-sm">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <Link
              href="/"
              className="text-base font-bold tracking-tight text-white hover:text-cyan-300 transition-colors"
            >
              Git Build Inspector
            </Link>
          </div>

          {/* Zona 2: Metadati unboxed puliti con suppressHydrationWarning */}
          <nav className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span>Catturato a Build Time</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Versione {data.gitVersion ? data.gitVersion.replace('git version ', 'v') : 'Git'}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span suppressHydrationWarning className="font-mono tabular-nums">
              {formattedBuildTime}
            </span>
          </nav>

          {/* Zona 3: Indicatore di architettura Build-Time e Push Helper */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRemoteHelp(!showRemoteHelp)}
              className="px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
              <span>GitHub Remote</span>
            </button>

            <div className="hidden sm:flex px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 rounded-lg items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero Runtime Deps</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Banner Informativo Build-Time */}
        <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 text-cyan-200">
            <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Tutte le informazioni sono state compilate staticamente durante la fase di <strong className="font-semibold text-white">build time</strong>. Nessun comando shell o dipendenza da Git viene eseguito a runtime.
            </span>
          </div>
          <span
            suppressHydrationWarning
            className="font-mono text-xs text-cyan-400/80 shrink-0 bg-slate-900/80 px-2.5 py-1 rounded border border-cyan-500/20"
          >
            Snapshot: {formattedBuildTime}
          </span>
        </div>

        {/* GitHub Push Helper Modal / Box se attivato */}
        {showRemoteHelp && (
          <div className="p-5 rounded-xl border border-slate-700 bg-slate-900/90 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-cyan-400" />
                Configurazione Push su GitHub
              </h3>
              <button
                onClick={() => setShowRemoteHelp(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Chiudi
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Per inviare i commit al tuo repository remoto su GitHub, esegui questi comandi nel terminale:
            </p>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 space-y-1.5 select-all">
              <p>git remote add origin https://github.com/&lt;IL_TUO_USERNAME&gt;/&lt;IL_TUO_REPO&gt;.git</p>
              <p>git branch -M main</p>
              <p>git push -u origin main</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() =>
                  handleCopy(
                    'git remote add origin https://github.com/<USERNAME>/<REPO>.git\ngit branch -M main\ngit push -u origin main',
                    'git-push-cmds'
                  )
                }
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 flex items-center gap-1.5"
              >
                {copiedKey === 'git-push-cmds' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiato!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copia comandi
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-cyan-400 uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5" />
            <span>Metadati Git Compilati</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
            Stato Git alla Compilazione
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Report statico delle proprietà del repository congelate al momento della build dell&apos;applicazione Next.js.
          </p>
        </div>

        {/* 4 CARD RICHIESTE: Ultimo Tag, Branch, Dirty, Hash Commit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. ULTIMO TAG */}
          <div className="group relative rounded-xl border border-slate-800 bg-slate-900/70 p-5 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-medium text-slate-400">Ultimo Tag</span>
                <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Tag className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold tracking-tight text-white font-mono break-all">
                    {data.latestTag || 'Nessun tag'}
                  </span>
                  {data.latestTag && (
                    <button
                      onClick={() => handleCopy(data.latestTag, 'tag')}
                      className="p-1 text-slate-500 hover:text-slate-300 transition-colors rounded"
                      title="Copia tag"
                    >
                      {copiedKey === 'tag' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {data.latestTag
                    ? `Tag di rilascio presente alla build`
                    : 'Nessun tag presente alla build'}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span>{data.stats?.totalTags ?? 0} tag rilevati</span>
              <span className="text-purple-400 font-mono text-[11px]">describe --tags</span>
            </div>
          </div>

          {/* 2. BRANCH */}
          <div className="group relative rounded-xl border border-slate-800 bg-slate-900/70 p-5 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-medium text-slate-400">Branch</span>
                <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <GitBranch className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold tracking-tight text-white font-mono truncate">
                    {data.currentBranch}
                  </span>
                  <button
                    onClick={() => handleCopy(data.currentBranch, 'branch')}
                    className="p-1 text-slate-500 hover:text-slate-300 transition-colors rounded"
                    title="Copia branch"
                  >
                    {copiedKey === 'branch' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Ramo attivo durante la compilazione
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span>{data.stats?.totalBranches ?? 0} branch nel repo</span>
              <span className="text-blue-400 font-mono text-[11px]">branch --show-current</span>
            </div>
          </div>

          {/* 3. DIRTY SE IL REPO È DIRTY */}
          <div
            className={`group relative rounded-xl border p-5 transition-all flex flex-col justify-between ${
              data.isDirty
                ? 'border-amber-500/40 bg-amber-950/20'
                : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-medium text-slate-400">Stato Repository</span>
                <div
                  className={`p-1.5 rounded-md border ${
                    data.isDirty
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {data.isDirty ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-2xl font-bold tracking-tight font-mono ${
                      data.isDirty ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {data.isDirty ? 'DIRTY' : 'CLEAN'}
                  </span>
                  {data.isDirty && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-medium">
                      {data.dirtyFilesCount} {data.dirtyFilesCount === 1 ? 'file' : 'file'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {data.isDirty
                    ? 'Working tree con modifiche non committate alla build'
                    : 'Working tree pulito alla build'}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span className={data.isDirty ? 'text-amber-400 font-medium' : 'text-emerald-400 font-medium'}>
                {data.isDirty ? 'Modifiche presenti' : 'Clean build'}
              </span>
              <span className="text-amber-400 font-mono text-[11px]">status --porcelain</span>
            </div>
          </div>

          {/* 4. HASH DELL'ULTIMA COMMIT */}
          <div className="group relative rounded-xl border border-slate-800 bg-slate-900/70 p-5 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-medium text-slate-400">Hash Ultima Commit</span>
                <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <GitCommit className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold tracking-tight text-white font-mono">
                    {data.latestCommit ? data.latestCommit.shortHash : 'Nessuna'}
                  </span>
                  {data.latestCommit && (
                    <button
                      onClick={() => handleCopy(data.latestCommit.hash, 'commit-hash')}
                      className="p-1 text-slate-500 hover:text-slate-300 transition-colors rounded"
                      title="Copia hash completo a 40 caratteri"
                    >
                      {copiedKey === 'commit-hash' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate max-w-[200px]" title={data.latestCommit?.subject}>
                  {data.latestCommit?.subject || 'Nessun commit presente'}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate max-w-[130px]" title={data.latestCommit?.author}>
                {data.latestCommit?.author || 'Git'}
              </span>
              <span className="text-emerald-400 font-mono text-[11px]">rev-parse HEAD</span>
            </div>
          </div>
        </div>

        {/* DETTAGLIO MODIFICHE DIRTY / WORKING TREE */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  data.isDirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                }`}
              />
              <h2 className="text-sm font-semibold text-white">
                Verifica Stato Dirty al Momento della Compilazione
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {data.isDirty ? `${data.dirtyFilesCount} file modificati/non tracciati` : 'Stato pulito'}
            </span>
          </div>

          <div className="p-5">
            {data.isDirty && data.dirtyFiles && data.dirtyFiles.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  I seguenti file non erano committati al momento della creazione del bundle:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3 font-semibold w-24">Stato</th>
                        <th className="py-2.5 px-3 font-semibold">Percorso File</th>
                        <th className="py-2.5 px-3 font-semibold w-28 text-right">Area</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {data.dirtyFiles.map((file, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                file.status.includes('?')
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800/50'
                                  : file.status.includes('M')
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                                  : file.status.includes('D')
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                                  : 'bg-cyan-950 text-cyan-300 border border-cyan-800/50'
                              }`}
                            >
                              {file.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-200 flex items-center gap-2">
                            <FileCode className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{file.path}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`text-[11px] ${
                                file.staged ? 'text-emerald-400' : 'text-slate-400'
                              }`}
                            >
                              {file.staged ? 'Staged' : 'Unstaged / Untracked'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-slate-200">
                  Nessun file dirty al momento della build
                </p>
                <p className="text-xs text-slate-500 max-w-md">
                  L&apos;albero di lavoro era integro e allineato con l&apos;ultimo commit al momento della compilazione.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* DETTAGLIO COMMIT & CRONOLOGIA RECENSIONI */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scheda Dettaglio Ultimo Commit */}
          <div className="lg:col-span-1 rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-emerald-400" />
                Dettaglio Ultimo Commit
              </h3>
              <span className="text-[11px] font-mono text-cyan-400">HEAD</span>
            </div>

            {data.latestCommit ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-500 block mb-1">Messaggio Commit</span>
                  <p className="font-semibold text-slate-100 text-sm leading-snug">
                    {data.latestCommit.subject}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Hash Completo (SHA-1)</span>
                    <button
                      onClick={() => handleCopy(data.latestCommit.hash, 'full-hash')}
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      {copiedKey === 'full-hash' ? 'Copiato!' : 'Copia'}
                    </button>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 break-all select-all">
                    {data.latestCommit.hash}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      Autore
                    </span>
                    <span className="text-slate-200 font-medium">
                      {data.latestCommit.author}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Data Commit
                    </span>
                    <span suppressHydrationWarning className="text-slate-200 font-mono tabular-nums">
                      {data.latestCommit.relativeDate || formatTimestamp(data.latestCommit.date)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4">Nessun commit registrato nel repository.</p>
            )}
          </div>

          {/* Cronologia Commit Recenti */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Cronologia Recente Commit al Build Time
              </h3>
              <span className="text-xs text-slate-500">
                Totale {data.stats?.totalCommits ?? 0} commit
              </span>
            </div>

            {data.recentCommits && data.recentCommits.length > 0 ? (
              <div className="space-y-3">
                {data.recentCommits.map((c, index) => (
                  <div
                    key={c.hash}
                    className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-6 h-6 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center font-mono text-[10px] text-cyan-400 font-semibold shrink-0">
                        {index + 1}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200 text-sm">
                            {c.subject}
                          </span>
                          {index === 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-medium">
                              HEAD
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                          <span>{c.author}</span>
                          <span aria-hidden="true">·</span>
                          <span suppressHydrationWarning className="font-mono tabular-nums">
                            {c.relativeDate || formatTimestamp(c.date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <span className="font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-[11px]">
                        {c.shortHash}
                      </span>
                      <button
                        onClick={() => handleCopy(c.hash, `c-${c.hash}`)}
                        className="p-1.5 text-slate-500 hover:text-slate-300 rounded border border-slate-800 hover:border-slate-700 bg-slate-900 transition-colors"
                        title="Copia hash completo"
                      >
                        {copiedKey === `c-${c.hash}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                Nessun commit registrato nella cronologia.
              </p>
            )}
          </div>
        </section>

        {/* GUIDA AI COMANDI ESEGUITI DURANTE LA BUILD */}
        <section className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              Comandi Git Eseguiti a Build Time
            </h3>
            <span className="text-xs text-slate-500 font-mono">Build-Time Hooks</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-slate-500 text-[11px] block font-sans">1. Ultimo Tag</span>
              <p className="text-cyan-300">git describe --tags --abbrev=0</p>
              <p className="text-slate-400 text-[11px] font-sans truncate">
                Valore: {data.latestTag || 'Nessun tag'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-slate-500 text-[11px] block font-sans">2. Branch</span>
              <p className="text-cyan-300">git branch --show-current</p>
              <p className="text-slate-400 text-[11px] font-sans truncate">
                Valore: {data.currentBranch}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-slate-500 text-[11px] block font-sans">3. Stato Dirty</span>
              <p className="text-cyan-300">git status --porcelain</p>
              <p className="text-slate-400 text-[11px] font-sans truncate">
                Valore: {data.isDirty ? `DIRTY (${data.dirtyFilesCount} file)` : 'CLEAN'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-slate-500 text-[11px] block font-sans">4. Hash Ultima Commit</span>
              <p className="text-cyan-300">git rev-parse HEAD</p>
              <p className="text-slate-400 text-[11px] font-sans truncate">
                Valore: {data.latestCommit ? data.latestCommit.shortHash : 'N/A'}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-6 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            Git Status Dashboard · Informazioni compilate a build-time (Zero dipendenze runtime)
          </p>
          <div className="flex items-center gap-4">
            <span className="text-slate-600">|</span>
            <span suppressHydrationWarning className="font-mono tabular-nums text-slate-400">
              Build: {formattedBuildTime}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
