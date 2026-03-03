import { describe, expect, it } from "vitest";

import { parseTransactionImportText, toIsoDateAtNoon } from "../../src/modules/transactions/transaction-import.parser";

describe("transaction import parser", () => {
  it("parses valid lines and normalizes recurring aliases", () => {
    const input = `
01/03 entrada salario 5000.00 renda c6 nao
02/03 saida mercado 50,25 alimentacao c6 recorrente
03/03 saida uber 20.00 transporte c6 true
`;

    const parsed = parseTransactionImportText(input);

    expect(parsed.invalid).toHaveLength(0);
    expect(parsed.valid).toHaveLength(3);
    expect(parsed.valid[0]).toMatchObject({
      lineNumber: 2,
      kind: "INCOME",
      amount: "5000.00",
      recurring: false,
    });
    expect(parsed.valid[1]).toMatchObject({
      lineNumber: 3,
      kind: "EXPENSE",
      amount: "50.25",
      recurring: true,
    });
    expect(parsed.valid[2]?.recurring).toBe(true);
  });

  it("reports line-specific parsing errors without dropping valid lines", () => {
    const input = `
01/03 entrada salario 1000.00 renda c6 nao
31/02 saida conta 10.00 casa c6 nao
05/03 bogus compra 12.00 mercado c6 nao
06/03 saida compra_bahamas xx mercado c6 nao
`;

    const parsed = parseTransactionImportText(input);

    expect(parsed.valid).toHaveLength(1);
    expect(parsed.invalid).toHaveLength(3);
    expect(parsed.invalid.map((item) => item.lineNumber)).toEqual([3, 4, 5]);
    expect(parsed.invalid.map((item) => item.reason)).toEqual([
      "DATA_DIA_MES_INVALIDA",
      "TIPO_INVALIDO_USE_ENTRADA_OU_SAIDA",
      "VALOR_INVALIDO",
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
