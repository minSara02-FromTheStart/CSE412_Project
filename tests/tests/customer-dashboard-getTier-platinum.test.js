describe("getTier", () => {

  test("returns Platinum and null next tier for 300 points", () => {

    const getTier = (points) => {
      if (points >= 300) {
        return {
          tier: "Platinum",
          nextTier: null
        };
      }

      if (points >= 200) {
        return {
          tier: "Gold",
          nextTier: "Platinum"
        };
      }

      if (points >= 100) {
        return {
          tier: "Silver",
          nextTier: "Gold"
        };
      }

      return {
        tier: "Bronze",
        nextTier: "Silver"
      };
    };

    const result = getTier(300);

    expect(result.tier).toBe("Platinum");
    expect(result.nextTier).toBeNull();
  });

});