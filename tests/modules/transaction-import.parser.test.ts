import { describe, expect, it } from "vitest";

import { parseTransactionImportText, toIsoDateAtNoon } from "../../src/modules/transactions/transaction-import.parser";

describe("transaction import parser", () => {
  it("parses single and installment amounts with recurring aliases", () => {
    const input = `
mercado da semana 500.00
academia 120 recorrente
celular 50.22*3 sim
notebook 150/3 mensal
`;

    const parsed = parseTransactionImportText(input);

    expect(parsed.invalid).toHaveLength(0);
    expect(parsed.valid).toHaveLength(4);
    expect(parsed.valid[0]).toMatchObject({
      lineNumber: 2,
      valueMode: "SINGLE",
      kind: "EXPENSE",
      amount: "500.00",
      recurring: false,
    });
    expect(parsed.valid[1]).toMatchObject({
      lineNumber: 3,
      valueMode: "SINGLE",
      kind: "EXPENSE",
      amount: "120.00",
      recurring: true,
    });
    expect(parsed.valid[2]).toMatchObject({
      lineNumber: 4,
      valueMode: "INSTALLMENT",
      totalAmount: "150.66",
      installmentsCount: 3,
      recurring: true,
    });
    expect(parsed.valid[3]).toMatchObject({
      lineNumber: 5,
      valueMode: "INSTALLMENT",
      totalAmount: "150.00",
      installmentsCount: 3,
      recurring: true,
    });
  });

  it("accepts negative single amount", () => {
    const input = "estorno cartao -120.50";
    const parsed = parseTransactionImportText(input);
    expect(parsed.invalid).toHaveLength(0);
    expect(parsed.valid).toHaveLength(1);
    expect(parsed.valid[0]).toMatchObject({
      valueMode: "SINGLE",
      kind: "EXPENSE",
      amount: "-120.50",
      recurring: false,
    });
  });

  it("reports line-specific parsing errors without dropping valid lines", () => {
    const input = `
mercado 100.00
semvalor
telefone xx
`;

    const parsed = parseTransactionImportText(input);

    expect(parsed.valid).toHaveLength(1);
    expect(parsed.invalid).toHaveLength(2);
    expect(parsed.invalid.map((item) => item.lineNumber)).toEqual([3, 4]);
    expect(parsed.invalid.map((item) => item.reason)).toEqual(["FORMATO_INVALIDO_DESCRICAO_E_VALOR", "VALOR_INVALIDO"]);
  });

  it("rejects invalid installment formats", () => {
    const input = `
compra 50*1
compra 150/1
compra 50X3
compra 50.22 *3
compra 150 /3
`;

    const parsed = parseTransactionImportText(input);
    expect(parsed.valid).toHaveLength(0);
    expect(parsed.invalid).toHaveLength(5);
    expect(parsed.invalid.every((item) => item.reason === "VALOR_INVALIDO")).toBe(true);
  });

  it("converts yyyy-mm-dd to noon iso", () => {
    expect(toIsoDateAtNoon("2026-02-01")).toBe("2026-02-01T12:00:00.000Z");
  });
});
