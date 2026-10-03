import GitDashboard from '@/components/git-dashboard';
import { getGitInfo } from '@/lib/git';

// La pagina viene pre-renderizzata staticamente
export const dynamic = 'force-static';

export default function Home() {
  const gitInfo = getGitInfo();
  return <GitDashboard gitInfo={gitInfo} />;
}
