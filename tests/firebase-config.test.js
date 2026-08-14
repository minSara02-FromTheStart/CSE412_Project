/**
 * Firebase configuration tests
 */

// =========================================================
// UNIT TEST
// =========================================================

test("initializes Firebase with the expected configuration", () => {
  const fs = require("fs");

  const source = fs.readFileSync(
  require.resolve("../js/firebase-config.js"),
  "utf8"
);

  // Check that the Firebase configuration contains
  // the required fields used by the application.
  expect(source).toContain("apiKey:");
  expect(source).toContain("authDomain:");
  expect(source).toContain("projectId:");
  expect(source).toContain("storageBucket:");
  expect(source).toContain("messagingSenderId:");
  expect(source).toContain("appId:");

  // Check that Firebase initialization is performed.
  expect(source).toContain("initializeApp(firebaseConfig)");
  expect(source).toContain("getAuth(app)");
  expect(source).toContain("getFirestore(app)");
});


// =========================================================
// NEGATIVE TEST
// =========================================================

test("configuration does not depend on environment variables", () => {
  const fs = require("fs");

  const source = fs.readFileSync(
  require.resolve("../js/firebase-config.js"),
  "utf8"
);

  // The current implementation uses hard-coded configuration
  // values, so removing environment variables should not affect it.
  expect(source).not.toContain("process.env");
});