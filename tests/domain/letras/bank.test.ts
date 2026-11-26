import { describe, expect, it } from "vitest";
import { getBank, parseBank, type BankLetter, type BankWord } from "@/domain/letras/bank";
import { PICTURE_IDS, WORD_IDS } from "@/domain/trail/schema";
import bankJson from "../../../content/areas/letras/bank.json";

/* eslint-disable @typescript-eslint/no-explicit-any -- tests mutate raw JSON to build invalid fixtures */
const clone = () => structuredClone(bankJson) as any;

describe("letras bank", () => {
  const bank = getBank();
  const letters = bank.items.filter((i): i is BankLetter => i.kind === "letter");
  const words = bank.items.filter((i): i is BankWord => i.kind === "word");

  it("parses once", () => {
    expect(getBank()).toBe(bank);
    expect(bank.area).toBe("letras");
  });

  it("has the 26 letters: A to M in unit 1, N to Z in unit 2", () => {
    expect(letters.map((l) => l.id).join("")).toBe("abcdefghijklmnopqrstuvwxyz");
    expect(letters.filter((l) => l.unit === 1).map((l) => l.id).join("")).toBe("abcdefghijklm");
    expect(letters.filter((l) => l.unit === 2).map((l) => l.id).join("")).toBe("nopqrstuvwxyz");
    expect(letters.find((l) => l.id === "b")).toMatchObject({ name: "bee", words: ["ball", "bed", "bus", "box"] });
  });

  it("every letter has a word that starts with it (X: a word that ends with it)", () => {
    for (const l of letters) {
      const own = l.words.map((id) => words.find((w) => w.id === id)!);
      if (l.id === "x") expect(own.some((w) => w.en.endsWith("x")), l.id).toBe(true);
      else expect(own.some((w) => w.initial === l.id), l.id).toBe(true);
    }
    expect(letters.find((l) => l.id === "x")!.words[0]).toBe("box");
  });

  it("uses every picture once, and the 15 written words are the three-letter words", () => {
    expect(words.map((w) => w.art).sort()).toEqual([...PICTURE_IDS].sort());
    const threeLetter = words.filter((w) => (WORD_IDS as readonly string[]).includes(`word-${w.en}`)).map((w) => `word-${w.en}`);
    expect(threeLetter.sort()).toEqual([...WORD_IDS].sort());
    for (const w of words) expect(w.en.startsWith(w.initial)).toBe(true);
    expect(words.find((w) => w.id === "ball")).toMatchObject({ en: "ball", pt: "bola", art: "ball", initial: "b", unit: 1 });
  });

  it("marks words of galhos 1, 2 and the new three-letter words of galho 4", () => {
    expect(words.filter((w) => w.unit === 1)).toHaveLength(13);
    expect(words.filter((w) => w.unit === 2)).toHaveLength(13);
    expect(words.filter((w) => w.unit === 4).map((w) => w.id)).toEqual(["bed", "bus", "cup", "fox", "hen", "map", "net"]);
  });

  it("rejects broken banks", () => {
    expect(() => parseBank(bankJson)).not.toThrow();
    let b = clone();
    b.items.find((i: any) => i.id === "b").words.push("ghost");
    expect(() => parseBank(b)).toThrow();
    b = clone();
    b.items.find((i: any) => i.id === "c").words = ["dog"];
    expect(() => parseBank(b)).toThrow();
    b = clone();
    b.items = b.items.filter((i: any) => i.id !== "q");
    expect(() => parseBank(b)).toThrow();
    b = clone();
    b.items.find((i: any) => i.id === "ball").art = "ghost";
    expect(() => parseBank(b)).toThrow();
    b = clone();
    b.units[0].story.question.answerId = "dog";
    expect(() => parseBank(b)).toThrow();
  });
});
