// src/chapter-spec.ts
var CHAPTER_TEST_SPECS = {
  "01": { expectedTestCount: 3 }
};
var TEST_SUITE_VERSION = "0.0.0";
function getChapterSpec(chapter) {
  return CHAPTER_TEST_SPECS[chapter] ?? null;
}
export {
  CHAPTER_TEST_SPECS,
  TEST_SUITE_VERSION,
  getChapterSpec
};
