/**
 * @jest-environment jsdom
 */

describe("watchRewards", () => {

  test("updates reward state and notifies observers", () => {

    let rewardState = [];
    const observer = jest.fn();

    const watchRewards = (rewards) => {
      rewardState = rewards;
      observer(rewardState);
    };

    const rewards = [
      {
        id: "reward1",
        points: 100
      },
      {
        id: "reward2",
        points: 200
      }
    ];

    watchRewards(rewards);

    expect(rewardState).toEqual(rewards);
    expect(observer).toHaveBeenCalledWith(rewards);
  });

});