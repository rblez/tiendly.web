import packageJson from '../../package.json';

const buildTimestamp = import.meta.env.VITE_BUILD_TIMESTAMP ?? '';
const commitSha = import.meta.env.VITE_GIT_COMMIT_SHA ?? '';
const deploymentId = import.meta.env.VITE_DEPLOYMENT_ID ?? '';
const branch = import.meta.env.VITE_GIT_BRANCH ?? 'local';

export const buildInfo = {
  version: packageJson.version,
  commitSha: commitSha || 'desarrollo local',
  shortCommitSha: commitSha ? commitSha.slice(0, 7) : 'local',
  deploymentId: deploymentId || 'sin despliegue',
  branch,
  buildTimestamp,
};

export function formatBuildDate(value: string) {
  if (!value) return 'No disponible';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('es-CU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
