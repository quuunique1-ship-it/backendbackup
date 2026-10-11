import { describe, it, expect } from "vitest";
import { DefaultPasswordPolicy } from "../src/infrastructure/policies/DefaultPasswordPolicy.js";
import {
  MinimumLengthRule,
  UppercaseRule,
  LowercaseRule,
  NumberRule,
  SpecialCharacterRule,
  NoSpacesRule,
} from "../src/infrastructure/policies/password-rules.js";

describe("PasswordPolicy", () => {
  it("accepts a valid password that satisfies every standard rule", () => {
    const policy = new DefaultPasswordPolicy([
      new MinimumLengthRule(8),
      new UppercaseRule(),
      new LowercaseRule(),
      new NumberRule(),
      new SpecialCharacterRule(),
    ]);

    const result = policy.validate("ValidPass!1");

    expect(result.isValid).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it("reports a minimum length failure", () => {
    const policy = new DefaultPasswordPolicy([new MinimumLengthRule(8)]);

    const result = policy.validate("Short1!");

    expect(result.isValid).toBe(false);
    expect(result.failures).toContain("minimumLength");
  });

  it("reports an uppercase failure", () => {
    const policy = new DefaultPasswordPolicy([new UppercaseRule()]);

    const result = policy.validate("lowercase123!");

    expect(result.isValid).toBe(false);
    expect(result.failures).toContain("uppercase");
  });

  it("reports a lowercase failure", () => {
    const policy = new DefaultPasswordPolicy([new LowercaseRule()]);

    const result = policy.validate("UPPERCASE123!");

    expect(result.isValid).toBe(false);
    expect(result.failures).toContain("lowercase");
  });

  it("reports a number failure", () => {
    const policy = new DefaultPasswordPolicy([new NumberRule()]);

    const result = policy.validate("Password!" );

    expect(result.isValid).toBe(false);
    expect(result.failures).toContain("number");
  });

  it("reports a special character failure", () => {
    const policy = new DefaultPasswordPolicy([new SpecialCharacterRule()]);

    const result = policy.validate("Password1");

    expect(result.isValid).toBe(false);
    expect(result.failures).toContain("specialCharacter");
  });

  it("reports multiple failures together", () => {
    const policy = new DefaultPasswordPolicy([
      new MinimumLengthRule(8),
      new UppercaseRule(),
      new LowercaseRule(),
      new NumberRule(),
      new SpecialCharacterRule(),
    ]);

    const result = policy.validate("BAD");

    expect(result.isValid).toBe(false);
    expect(result.failures).toEqual(
      expect.arrayContaining([
        "minimumLength",
        "lowercase",
        "number",
        "specialCharacter",
      ])
    );
  });

  it("supports a newly added rule without changing the policy class", () => {
    const policy = new DefaultPasswordPolicy([
      new MinimumLengthRule(8),
      new UppercaseRule(),
      new LowercaseRule(),
      new NumberRule(),
      new SpecialCharacterRule(),
      new NoSpacesRule(),
    ]);

    const result = policy.validate("No SpacePass!1");

    expect(result.isValid).toBe(false);
    expect(result.failures).toContain("noSpaces");
  });
});
