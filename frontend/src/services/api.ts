export interface Integration {
  id: string;
  source: string;
  target: string;
  type: string;
  evidence: string;
  file?: string;
  line?: number;
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

import axios from "axios";

const BASE_URL = "http://127.0.0.1:5000/api";

export const getEdges = async () => {
  const res = await axios.get(`${BASE_URL}/edges`);
  return res.data;
};