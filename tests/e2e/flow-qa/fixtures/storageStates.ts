import path from 'path';

const storageDirFromEnv = process.env.QA_E2E_STORAGE_DIR?.trim();
const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
const storageDir = storageDirFromEnv
  ? path.resolve(storageDirFromEnv)
  : path.join(
      repoRoot,
      'qa_verifications',
      'E2E-Flow-QA',
      'e2e_flow_qa_latest',
      'artifacts',
      'flow-qa-fixtures',
      'storage',
    );

export const storageStates = {
  authenticated: path.join(storageDir, 'authenticated.json'),
  talentPartnerOnly: path.join(storageDir, 'talent-partner-only.json'),
  candidateOnly: path.join(storageDir, 'candidate-only.json'),
};
