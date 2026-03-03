import Decimal from "decimal.js";

import type {
  FreeBalanceAlert,
  FreeBalanceConfidence,
  FreeBalanceRiskLevel,
  FreeBalanceTopDriver,
} from "./free-balance.types";

export interface FreeBalancePolicyInput {
  freeBalanceNext: string;
  confidence: FreeBalanceConfidence;
  missingData: string[];
  topDrivers: FreeBalanceTopDriver[];
}

export interface FreeBalancePolicyResult {
  risk: FreeBalanceRiskLevel;
  alerts: FreeBalanceAlert[];
}

const YELLOW_THRESHOLD = new Decimal("500.00");

function toCurrency(value: string): string {
  return `R$ ${new Decimal(value).toFixed(2)}`;
}

export class FreeBalancePolicy {
  classify(input: FreeBalancePolicyInput): FreeBalancePolicyResult {
    const next = new Decimal(input.freeBalanceNext);
    const alerts: FreeBalanceAlert[] = [];

    let risk: FreeBalanceRiskLevel = "GREEN";
    if (next.lessThan(0)) {
      risk = "RED";
      alerts.push({
        level: "danger",
        title: "Risco de saldo negativo no proximo mes",
        message: `A projecao indica saldo livre de ${toCurrency(input.freeBalanceNext)} no proximo mes.`,
        suggestions: [
          "Reduza compras no cartao neste mes.",
          "Adie despesas nao essenciais para o mes seguinte.",
          "Revise recorrencias e parcelas ativas para cortar custos.",
        ],
      });
    } else if (next.lessThan(YELLOW_THRESHOLD)) {
      risk = "YELLOW";
      alerts.push({
        level: "warning",
        title: "Margem apertada para novas compras",
        message: `Voce ainda tem ${toCurrency(input.freeBalanceNext)}, mas com pouca folga.`,
        suggestions: ["Evite aumentar a fatura do cartao.", "Priorize despesas obrigatorias ate o fechamento do mes."],
      });
    } else {
      alerts.push({
        level: "info",
        title: "Saldo livre saudavel",
        message: `Ha ${toCurrency(input.freeBalanceNext)} de capacidade projetada para o proximo mes.`,
        suggestions: ["Mantenha o ritmo atual de gastos para preservar a folga."],
      });
    }

    if (input.confidence === "LOW") {
      alerts.push({
        level: "warning",
        title: "Projecao com baixa confiabilidade",
        message: "Faltam dados importantes para aumentar a precisao da projecao.",
        suggestions: input.missingData,
      });
    }

    if (input.topDrivers.length > 0) {
      const mostRelevant = input.topDrivers[0];
      alerts.push({
        level: "info",
        title: "Principal fator de pressao",
        message: `${mostRelevant.label} impacta ${toCurrency(mostRelevant.amount)} em ${mostRelevant.month}.`,
        suggestions: ["Use o top 3 para decidir o que reduzir primeiro."],
      });
    }

    return { risk, alerts };
  }
}
