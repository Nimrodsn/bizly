export type TrainingFundInput = {
  businessTaxableIncome: number;
  selfEmployedDeposits: number;
  employerDeposits: number;
  deductionRate: number;
  incomeCeiling: number | null;
};

export type TrainingFundResult = {
  maxDeductibleBase: number;
  estimatedDeductible: number;
  remainingDeductible: number;
  totalDeposited: number;
};

export function calculateTrainingFund(input: TrainingFundInput): TrainingFundResult {
  const ceiling = input.incomeCeiling ?? input.businessTaxableIncome;
  const base = Math.min(input.businessTaxableIncome, ceiling);
  const maxDeductible = base * input.deductionRate;
  const deposited = input.selfEmployedDeposits + input.employerDeposits;
  const estimatedDeductible = Math.min(maxDeductible, deposited);
  const remaining = Math.max(0, maxDeductible - deposited);
  return {
    maxDeductibleBase: maxDeductible,
    estimatedDeductible,
    remainingDeductible: remaining,
    totalDeposited: deposited,
  };
}
