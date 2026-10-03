import gitData from './git-info.json';

/**
 * Restituisce i metadati Git catturati a build-time.
 * Nessuna esecuzione di comandi shell o dipendenza da Git a runtime.
 */
export function getGitInfo() {
  return gitData;
}

export default gitData;
