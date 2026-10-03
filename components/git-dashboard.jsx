'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  GitBranch,
  Tag,
  GitCommit,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Terminal,
  FolderGit2,
  Clock,
  User,
  Plus,
  Trash2,
  FileCode,
  GitPullRequest,
} from 'lucide-react';

export default function GitDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Form states per le azioni interattive
  const [newTagName, setNewTagName] = useState('');
  const [showTagForm, setShowTagForm] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [showCommitForm, setShowCommitForm] = useState(false);

  const fetchGitInfo = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await fetch('/api/git', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        setFeedback({
          type: 'error',
          message: json.error || 'Errore nel recupero delle informazioni Git.',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: `Impossibile comunicare con il server: ${err?.message || err}`,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch('/api/git', { cache: 'no-store' });
        const json = await res.json();
        if (!ignore) {
          if (res.ok) {
            setData(json);
          } else {
            setFeedback({
              type: 'error',
              message: json.error || 'Errore nel recupero delle informazioni Git.',
            });
          }
        }
      } catch (err) {
        if (!ignore) {
          setFeedback({
            type: 'error',
            message: `Impossibile comunicare con il server: ${err?.message || err}`,
          });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  // Aggiornamento automatico periodico
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchGitInfo(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchGitInfo]);

  // Copia negli appunti
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  // Esecuzione azione Git (toggle dirty, clean, tag, commit, branch)
  const handleAction = async (action, payload = {}) => {
    setActionLoading(action);
    setFeedback(null);
    try {
      const res = await fetch('/api/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const result = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', message: result.message });
        if (result.gitInfo) {
          setData(result.gitInfo);
        } else {
          await fetchGitInfo(true);
        }
        if (action === 'create-tag') {
          setNewTagName('');
          setShowTagForm(false);
        }
        if (action === 'switch-branch') {
          setNewBranchName('');
          setShowBranchForm(false);
        }
        if (action === 'create-commit') {
          setCommitMessage('');
          setShowCommitForm(false);
        }
      } else {
        setFeedback({ type: 'error', message: result.message || 'Operazione fallita.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: `Errore di rete: ${err?.message || err}` });
    } finally {
      setActionLoading(null);
      setTimeout(() => {
        setFeedback((prev) => (prev?.message ? null : prev));
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Bar Contract (3 zone standard) */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Zona 1: Nome brand singolo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-sm">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <Link href="/" className="text-base font-bold tracking-tight text-white hover:text-cyan-300 transition-colors">
              Git Inspector
            </Link>
          </div>

          {/* Zona 2: Metadati puliti unboxed con separatori tipografici */}
          <nav className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span>Workspace</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Versione {data?.gitVersion ? data.gitVersion.replace('git version ', 'v') : 'Git'}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono tabular-nums">
              {data?.lastChecked ? new Date(data.lastChecked).toLocaleTimeString('it-IT') : '--:--:--'}
            </span>
          </nav>

          {/* Zona 3: Controlli e azioni primarie */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border flex items-center gap-1.5 whitespace-nowrap ${
                autoRefresh
                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
              title="Attiva aggiornamento automatico ogni 4 secondi"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  autoRefresh ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'
                }`}
              />
              Auto 4s
            </button>

            <button
              onClick={() => fetchGitInfo()}
              disabled={refreshing}
              className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
              Aggiorna
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Banner Notifiche Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="text-xs opacity-75 hover:opacity-100 underline shrink-0"
              >
                Chiudi
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Intestazione Sezione */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-cyan-400 uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5" />
            <span>Stato Repository Corrente</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
            Informazioni Git del Progetto
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Monitoraggio dei metadati Git per la directory di lavoro corrente: ultimo tag, branch attivo, verifica stato dirty e hash crittografico dell&apos;ultimo commit.
          </p>
        </div>

        {/* Skeleton di caricamento */}
        {loading && !data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-44 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse p-5 space-y-4"
              >
                <div className="w-20 h-4 bg-slate-800 rounded" />
                <div className="w-32 h-8 bg-slate-800 rounded" />
                <div className="w-full h-4 bg-slate-800/60 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Stato non-repository Git */}
        {data && !data.isGitRepo && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-6 text-amber-200 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-semibold text-white">Repository Git non rilevato</h3>
                <p className="text-sm text-slate-300">
                  {data.error || 'Nessun repository Git attivo nella cartella di lavoro corrente.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleAction('init-repo')}
              disabled={actionLoading === 'init-repo'}
              className="px-4 py-2 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {actionLoading === 'init-repo' ? 'Inizializzazione...' : 'Inizializza Git Repository ora'}
            </button>
          </div>
        )}

        {/* 4 CARD RICHIESTE: Ultimo Tag, Branch, Dirty, Hash Commit */}
        {data && data.isGitRepo && (
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
                      ? `Versione di rilascio corrente`
                      : 'Nessun tag annotato o leggero'}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span>{data.stats.totalTags} tag registrati</span>
                <button
                  onClick={() => setShowTagForm(!showTagForm)}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Crea tag
                </button>
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
                      title="Copia nome branch"
                    >
                      {copiedKey === 'branch' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    Ramo di sviluppo attivo nel working tree
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span>{data.stats.totalBranches} branch locali</span>
                <button
                  onClick={() => setShowBranchForm(!showBranchForm)}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium flex items-center gap-1"
                >
                  <GitPullRequest className="w-3 h-3" />
                  Cambia
                </button>
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
                      ? 'Presenti modifiche non salvate in commit'
                      : 'Working tree pulito, nessuna modifica'}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                {data.isDirty ? (
                  <button
                    onClick={() => handleAction('clean-dirty')}
                    disabled={actionLoading === 'clean-dirty'}
                    className="text-amber-400 hover:text-amber-300 transition-colors font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Pulisci repo
                  </button>
                ) : (
                  <span className="text-slate-500">Integrità verificata</span>
                )}

                <button
                  onClick={() => handleAction('toggle-dirty')}
                  disabled={actionLoading === 'toggle-dirty'}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                >
                  {data.isDirty ? 'Rimuovi test' : 'Simula dirty'}
                </button>
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
                <span className="font-mono tabular-nums">{data.stats.totalCommits} commit</span>
              </div>
            </div>
          </div>
        )}

        {/* MODULI DI CREAZIONE AZIONI (Tag, Branch, Commit) */}
        <AnimatePresence>
          {showTagForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-purple-200 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-400" />
                    Crea un nuovo Git Tag
                  </h3>
                  <button
                    onClick={() => setShowTagForm(false)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Annulla
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    placeholder="Es. v1.1.0 o release-2026"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <button
                    onClick={() => handleAction('create-tag', { name: newTagName })}
                    disabled={!newTagName.trim() || actionLoading === 'create-tag'}
                    className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {actionLoading === 'create-tag' ? 'Creazione in corso...' : 'Conferma e Applica Tag'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {showBranchForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-blue-200 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-blue-400" />
                    Cambia o Crea Branch
                  </h3>
                  <button
                    onClick={() => setShowBranchForm(false)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Annulla
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nome branch (es. feature/login o staging)"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    onClick={() => handleAction('switch-branch', { name: newBranchName })}
                    disabled={!newBranchName.trim() || actionLoading === 'switch-branch'}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {actionLoading === 'switch-branch' ? 'Passaggio...' : 'Checkout / Crea Branch'}
                  </button>
                </div>
                {data && data.stats.allBranches.length > 0 && (
                  <div className="pt-2 flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                    <span>Branch disponibili:</span>
                    {data.stats.allBranches.map((b) => (
                      <button
                        key={b}
                        onClick={() => handleAction('switch-branch', { name: b })}
                        className={`px-2 py-0.5 rounded border text-xs font-mono transition-colors ${
                          b === data.currentBranch
                            ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {showCommitForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-emerald-200 flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-emerald-400" />
                    Crea un Nuovo Commit
                  </h3>
                  <button
                    onClick={() => setShowCommitForm(false)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Annulla
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    placeholder="Messaggio commit (es. chore: aggiornamento build)"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    onClick={() =>
                      handleAction('create-commit', { message: commitMessage || 'feat: test commit' })
                    }
                    disabled={actionLoading === 'create-commit'}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {actionLoading === 'create-commit' ? 'Creazione...' : 'Conferma Commit'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DETTAGLIO WORKING TREE & FILE MODIFICATI */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <h2 className="text-sm font-semibold text-white">
                Dettaglio Working Tree & File Modificati
              </h2>
              <span className="text-xs text-slate-500">
                ({data?.isDirty ? `${data.dirtyFilesCount} modifiche rilevate` : 'Nessuna modifica'})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAction('toggle-dirty')}
                disabled={actionLoading === 'toggle-dirty'}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg transition-colors"
              >
                {data?.isDirty ? 'Rimuovi test file' : 'Genera modifica di test'}
              </button>
              {data?.isDirty && (
                <button
                  onClick={() => handleAction('clean-dirty')}
                  disabled={actionLoading === 'clean-dirty'}
                  className="px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3 h-3" />
                  Scarta modifiche
                </button>
              )}
            </div>
          </div>

          <div className="p-5">
            {data?.isDirty ? (
              <div className="space-y-2">
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
                  L&apos;albero di lavoro è completamente pulito (Clean)
                </p>
                <p className="text-xs text-slate-500 max-w-md">
                  Non ci sono file modificati, eliminati o non tracciati. Puoi cliccare su &quot;Genera modifica di test&quot; per verificare in tempo reale il cambio di stato in DIRTY.
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
              <button
                onClick={() => setShowCommitForm(!showCommitForm)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Nuovo
              </button>
            </div>

            {data?.latestCommit ? (
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
                      Data
                    </span>
                    <span className="text-slate-200 font-mono tabular-nums">
                      {data.latestCommit.relativeDate ||
                        new Date(data.latestCommit.date).toLocaleString('it-IT')}
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
                Cronologia Recente Commit
              </h3>
              <span className="text-xs text-slate-500">
                Totale {data?.stats.totalCommits || 0} commit
              </span>
            </div>

            {data?.recentCommits && data.recentCommits.length > 0 ? (
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
                          <span className="font-mono tabular-nums">{c.relativeDate}</span>
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

        {/* GUIDA AI COMANDI GIT ESEGUITI */}
        <section className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-400" />
              Comandi Git Equivalenti Eseguiti dal Sistema
            </h3>
            <span className="text-xs text-slate-500 font-mono">CLI Shell Native</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-slate-500 text-[11px] block font-sans">Ultimo Tag</span>
              <p className="text-cyan-300">git describe --tags --abbrev=0</p>
              <p className="text-slate-400 text-[11px] font-sans truncate">
                Risultato: {data?.latestTag || 'Nessun tag'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-slate-500 text-[11px] block font-sans">Branch Corrente</span>
              <p className="text-cyan-300">git branch --show-current</p>
              <p className="text-slate-400 text-[11px] font-sans truncate">
                Risultato: {data?.currentBranch || 'N/A'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-slate-500 text-[11px] block font-sans">Verifica Dirty</span>
              <p className="text-cyan-300">git status --porcelain</p>
              <p className="text-slate-400 text-[11px] font-sans truncate">
                Risultato: {data?.isDirty ? 'Dirty (modifiche presenti)' : 'Clean'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-slate-500 text-[11px] block font-sans">Hash Ultima Commit</span>
              <p className="text-cyan-300">git rev-parse HEAD</p>
              <p className="text-slate-400 text-[11px] font-sans truncate">
                Risultato: {data?.latestCommit?.shortHash || 'N/A'}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-6 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            Git Status Dashboard · Analisi metadati in tempo reale per repository locale
          </p>
          <div className="flex items-center gap-4">
            <span className="text-slate-600">|</span>
            <span className="font-mono tabular-nums text-slate-400">
              Ultimo controllo: {data?.lastChecked ? new Date(data.lastChecked).toLocaleTimeString('it-IT') : '--:--'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
