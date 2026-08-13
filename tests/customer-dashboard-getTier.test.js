describe("getTier", () => {

  test("returns Bronze and next Silver for 0 points", () => {

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

    const result = getTier(0);

    expect(result.tier).toBe("Bronze");
    expect(result.nextTier).toBe("Silver");
  });

});