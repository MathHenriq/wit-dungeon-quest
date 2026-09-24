import { describe, expect, it } from "vitest";
import { publicDisplayName, toFirstTwoNames, validateFirstNames, validateNickname } from "../privacy";

describe("validateFirstNames", () => {
  it("aceita um ou dois nomes", () => {
    expect(validateFirstNames("João").error).toBeNull();
    expect(validateFirstNames("  João   Miguel ").value).toBe("João Miguel");
    expect(validateFirstNames("Ana-Clara").error).toBeNull();
  });

  it("recusa nome completo", () => {
    expect(validateFirstNames("João Miguel Macedo").error).toMatch(/dois primeiros nomes/);
  });

  it("recusa partículas, números e vazio", () => {
    expect(validateFirstNames("Maria de").error).not.toBeNull();
    expect(validateFirstNames("Pedro 123").error).not.toBeNull();
    expect(validateFirstNames("   ").error).not.toBeNull();
  });
});

describe("toFirstTwoNames", () => {
  it("mantém só os dois primeiros nomes, pulando partículas", () => {
    expect(toFirstTwoNames("João Miguel Macedo do Zacarioto")).toBe("João Miguel");
    expect(toFirstTwoNames("Maria de Souza Lima")).toBe("Maria Souza");
    expect(toFirstTwoNames("Theo")).toBe("Theo");
    expect(toFirstTwoNames(null)).toBe("");
  });
});

describe("validateNickname", () => {
  it("aceita nickname válido", () => {
    expect(validateNickname("Kirito_07").error).toBeNull();
  });

  it("recusa tamanho fora do limite e símbolos", () => {
    expect(validateNickname("ab").error).not.toBeNull();
    expect(validateNickname("a".repeat(21)).error).not.toBeNull();
    expect(validateNickname("<script>").error).not.toBeNull();
  });

  it("recusa nickname igual ao nome", () => {
    expect(validateNickname("joão miguel", "João Miguel").error).not.toBeNull();
  });

  it("recusa nickname que contém o nome, aceita quando só parece", () => {
    expect(validateNickname("Miguel_Ninja", "João Miguel").error).not.toBeNull();
    expect(validateNickname("Sr João 07", "João Miguel").error).not.toBeNull();
    expect(validateNickname("Joaozinho", "João Miguel").error).toBeNull();
  });
});

describe("publicDisplayName", () => {
  it("nunca cai no nome real", () => {
    expect(publicDisplayName({ character_name: "Kirito" })).toBe("Kirito");
    expect(publicDisplayName({ character_name: "  " })).toBe("Aventureiro");
    expect(publicDisplayName(null)).toBe("Aventureiro");
  });
});
