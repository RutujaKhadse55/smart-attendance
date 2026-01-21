// utils/validators.ts
export const isValidPRN = (prn: string) => !!prn && prn.trim().length > 0;
export const isUniquePRN = async (prn: string, existing: Set<string>) => !existing.has(prn);
