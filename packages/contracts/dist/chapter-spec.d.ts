/**
 * Expected test counts per chapter.
 *
 * The server rejects submissions whose `testsTotal` doesn't match — this
 * prevents students from gaming by deleting tests. The test-suite package can
 * also import this to self-verify its test count. Add entries as chapter test
 * suites are written.
 */
declare const CHAPTER_TEST_SPECS: Record<string, {
    expectedTestCount: number;
}>;
declare const TEST_SUITE_VERSION = "0.0.0";
declare function getChapterSpec(chapter: string): {
    expectedTestCount: number;
} | null;

export { CHAPTER_TEST_SPECS, TEST_SUITE_VERSION, getChapterSpec };
