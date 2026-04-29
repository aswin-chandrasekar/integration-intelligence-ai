export interface Integration {
  id: string;
  source: string;
  target: string;
  type: string;
  evidence: string;
  confidence: string;
  note: string;
  color: string;
}

export const scanRepository = async (repoPath: string) => {
  const response = await fetch('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoPath }),
  });
  return response.json();
};

export const getScanStatus = async () => {
  const response = await fetch('/api/status');
  return response.json();
};

export const getIntegrations = async (): Promise<Integration[]> => {
  const response = await fetch('/api/edges');
  return response.json();
};
