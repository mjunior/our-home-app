import { describe, expect, it } from "vitest";

import { parseTransactionImportText, toIsoDateAtNoon } from "../../src/modules/transactions/transaction-import.parser";

describe("transaction import parser", () => {
  it("parses single and installment amounts with recurring aliases", () => {
    const input = `
01/03 entrada salario 5000.00 renda c6 nao
02/03 saida mercado 50,25 alimentacao c6 recorrente
03/03 saida celular 50.22x3 transporte c6 recorrente
04/03 saida notebook 150/3 transporte c6 nao
`;

    const parsed = parseTransactionImportText(input);

    expect(parsed.invalid).toHaveLength(0);
    expect(parsed.valid).toHaveLength(4);
    expect(parsed.valid[0]).toMatchObject({
      lineNumber: 2,
      valueMode: "SINGLE",
      kind: "INCOME",
      amount: "5000.00",
      recurring: false,
    });
    expect(parsed.valid[1]).toMatchObject({
      lineNumber: 3,
      valueMode: "SINGLE",
      kind: "EXPENSE",
      amount: "50.25",
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
      recurring: false,
    });
  });

  it("accepts negative single amount for chargeback/storno", () => {
    const input = "06/02 saida estorno_cartao -120.50 outros cartaoc6 nao";
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
01/03 entrada salario 1000.00 renda c6 nao
31/02 saida conta 10.00 casa c6 nao
05/03 bogus compra 12.00 mercado c6 nao
06/03 saida compra_bahamas xx mercado c6 nao
07/03 entrada bonus 50x3 renda c6 nao
`;

    const parsed = parseTransactionImportText(input);

    expect(parsed.valid).toHaveLength(1);
    expect(parsed.invalid).toHaveLength(4);
    expect(parsed.invalid.map((item) => item.lineNumber)).toEqual([3, 4, 5, 6]);
    expect(parsed.invalid.map((item) => item.reason)).toEqual([
      "DATA_DIA_MES_INVALIDA",
      "TIPO_INVALIDO_USE_ENTRADA_OU_SAIDA",
      "VALOR_INVALIDO",
      "PARCELAMENTO_PERMITE_APENAS_SAIDA",
    ]);
  });

  it("rejects invalid installment formats", () => {
    const input = `
01/03 saida compra 50x1 mercado c6 nao
02/03 saida compra 150/1 mercado c6 nao
03/03 saida compra 50X3 mercado c6 nao
04/03 saida compra 50.22 x3 mercado c6 nao
05/03 saida compra 150 /3 mercado c6 nao
`;

    const parsed = parseTransactionImportText(input);
    expect(parsed.valid).toHaveLength(0);
    expect(parsed.invalid).toHaveLength(5);
    expect(parsed.invalid.every((item) => item.reason === "VALOR_INVALIDO")).toBe(true);
  });

  it("rejects recurring token outside recorrente/nao", () => {
    const input = `
01/03 saida compra 50.00 mercado c6 sim
02/03 saida compra 50.00 mercado c6 true
`;
    const parsed = parseTransactionImportText(input);
    expect(parsed.valid).toHaveLength(0);
    expect(parsed.invalid).toHaveLength(2);
    expect(parsed.invalid.map((item) => item.reason)).toEqual([
      "RECORRENCIA_INVALIDA_USE_RECORRENTE_OU_NAO",
      "RECORRENCIA_INVALIDA_USE_RECORRENTE_OU_NAO",
    ]);
  });

  it("rejects lines with wrong token count", () => {
    const parsed = parseTransactionImportText("01/03 entrada compra no formato");
    expect(parsed.valid).toHaveLength(0);
    expect(parsed.invalid).toHaveLength(1);
    expect(parsed.invalid[0]?.reason).toBe("FORMATO_INVALIDO_ESPERADO_7_TOKENS");
  });

  it("converts dd/mm to noon iso using reference year", () => {
    expect(toIsoDateAtNoon("01/02", 2026)).toBe("2026-02-01T12:00:00.000Z");
  });
});
