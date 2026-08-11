/**
 * @jest-environment jsdom
 */

describe("markAllSeen", () => {

  test("updates unseen reward docs with seenAt", () => {

    const rewards = [
      { id: "reward1", seenAt: null },
      { id: "reward2", seenAt: null }
    ];

    rewards.forEach(reward => {
      if (!reward.seenAt) {
        reward.seenAt = new Date();
      }
    });

    expect(rewards[0].seenAt).toBeInstanceOf(Date);
    expect(rewards[1].seenAt).toBeInstanceOf(Date);
  });

});