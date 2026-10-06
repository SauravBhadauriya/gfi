/**
 * Test Features Utility
 * Comprehensive test suite for mock data features
 * Run in console: testFeatures.runAllTests()
 */

import musicLibraryService from "../api/services/musicLibraryService";
import { videoEditorService } from "../api/services/videoEditorService";
import feedService from "../api/services/feedService";
import mockDataLoader from "./mockDataLoader";
import { ErrorHandler } from "./errorHandler";

interface TestResult {
  feature: string;
  test: string;
  passed: boolean;
  message: string;
  duration: number;
  data?: any;
}

class TestFeatures {
  private results: TestResult[] = [];
  private startTime = 0;

  async runAllTests() {
    console.log("\n🧪 STARTING COMPREHENSIVE FEATURE TESTS\n");
    console.log("=" + "=".repeat(79));

    this.results = [];

    // Initialize mock data loader
    await mockDataLoader.initialize();
    mockDataLoader.forceMockData(); // Force mock mode for testing

    // Run all test suites
    await this.testMusicLibrary();
    await this.testVideoEditor();
    await this.testFeed();
    await this.testErrorHandling();

    // Print results
    this.printResults();

    return this.results;
  }

  private async testMusicLibrary() {
    console.log("\n📀 TESTING MUSIC LIBRARY SERVICE\n");

    // Test 1: Get audio list
    await this.runTest("Music Library", "Get Audio List", async () => {
      const result = await musicLibraryService.getAudioList();
      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error("No audio data returned");
      }
      return {
        message: `✓ Retrieved ${result.data.length} tracks`,
        data: { trackCount: result.data.length },
      };
    });

    // Test 2: Get audio by category
    await this.runTest("Music Library", "Get Audio by Category", async () => {
      const result = await musicLibraryService.getAudioList(undefined, "hip-hop");
      if (!result.success) {
        throw new Error("Failed to fetch category");
      }
      return {
        message: `✓ Retrieved ${result.data?.length || 0} hip-hop tracks`,
        data: { categoryTrackCount: result.data?.length || 0 },
      };
    });

    // Test 3: Search audio
    await this.runTest("Music Library", "Search Audio", async () => {
      const result = await musicLibraryService.getAudioList(undefined, undefined, "beats");
      if (!result.success) {
        throw new Error("Search failed");
      }
      return {
        message: `✓ Search returned ${result.data?.length || 0} results`,
        data: { searchResults: result.data?.length || 0 },
      };
    });

    // Test 4: Get categories
    await this.runTest("Music Library", "Get Categories", async () => {
      const result = await musicLibraryService.getCategories();
      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error("No categories returned");
      }
      return {
        message: `✓ Retrieved ${result.data.length} music categories`,
        data: { categoryCount: result.data.length },
      };
    });
  }

  private async testVideoEditor() {
    console.log("\n🎬 TESTING VIDEO EDITOR SERVICE\n");

    // Test 1: Get filters
    await this.runTest("Video Editor", "Get Video Filters", async () => {
      const result = await videoEditorService.getVideoFilters();
      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error("No filters returned");
      }
      return {
        message: `✓ Retrieved ${result.data.length} video filters`,
        data: { filterCount: result.data.length },
      };
    });

    // Test 2: Get effects
    await this.runTest("Video Editor", "Get Effects", async () => {
      const result = await videoEditorService.getVideoEffects();
      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error("No effects returned");
      }
      return {
        message: `✓ Retrieved ${result.data.length} video effects`,
        data: { effectCount: result.data.length },
      };
    });

    // Test 3: Get transitions
    await this.runTest("Video Editor", "Get Transitions", async () => {
      const result = await videoEditorService.getVideoTransitions();
      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error("No transitions returned");
      }
      return {
        message: `✓ Retrieved ${result.data.length} video transitions`,
        data: { transitionCount: result.data.length },
      };
    });

    // Test 4: Get stickers
    await this.runTest("Video Editor", "Get Stickers", async () => {
      const result = await videoEditorService.getVideoStickers();
      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error("No stickers returned");
      }
      return {
        message: `✓ Retrieved ${result.data.length} stickers`,
        data: { stickerCount: result.data.length },
      };
    });
  }

  private async testFeed() {
    console.log("\n📱 TESTING FEED SERVICE\n");

    // Test 1: Get trending reels
    await this.runTest("Feed", "Get Trending Reels", async () => {
      const result = await feedService.getTrendingReels();
      if (!result.success || !result.data || result.data.reels.length === 0) {
        throw new Error("No trending reels returned");
      }
      return {
        message: `✓ Retrieved ${result.data.reels.length} trending reels`,
        data: { reelCount: result.data.reels.length },
      };
    });

    // Test 2: Get for you reels
    await this.runTest("Feed", "Get For You Reels", async () => {
      const result = await feedService.getForYouReels();
      if (!result.success || !result.data || result.data.reels.length === 0) {
        throw new Error("No for you reels returned");
      }
      return {
        message: `✓ Retrieved ${result.data.reels.length} for you reels`,
        data: { reelCount: result.data.reels.length },
      };
    });

    // Test 3: Get popular reels
    await this.runTest("Feed", "Get Popular Reels", async () => {
      const result = await feedService.getPopularReels();
      if (!result.success || !result.data || result.data.reels.length === 0) {
        throw new Error("No popular reels returned");
      }
      return {
        message: `✓ Retrieved ${result.data.reels.length} popular reels`,
        data: { reelCount: result.data.reels.length },
      };
    });

    // Test 4: Get categories
    await this.runTest("Feed", "Get Categories", async () => {
      const result = await feedService.getCategories();
      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error("No categories returned");
      }
      return {
        message: `✓ Retrieved ${result.data.length} content categories`,
        data: { categoryCount: result.data.length },
      };
    });

    // Test 5: Get featured collections
    await this.runTest("Feed", "Get Featured Collections", async () => {
      const result = await feedService.getFeaturedCollections();
      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error("No collections returned");
      }
      return {
        message: `✓ Retrieved ${result.data.length} featured collections`,
        data: { collectionCount: result.data.length },
      };
    });

    // Test 6: Toggle like reel
    await this.runTest("Feed", "Toggle Like Reel", async () => {
      const reelsResult = await feedService.getTrendingReels();
      if (!reelsResult.data || reelsResult.data.reels.length === 0) {
        throw new Error("No reels to test like");
      }
      const reelId = reelsResult.data.reels[0].id;
      const result = await feedService.toggleLikeReel(reelId);
      if (!result.success) {
        throw new Error("Failed to toggle like");
      }
      return {
        message: `✓ Successfully toggled like on reel ${reelId}`,
        data: { reelId, liked: result.data?.isLiked },
      };
    });

    // Test 7: Toggle save reel
    await this.runTest("Feed", "Toggle Save Reel", async () => {
      const reelsResult = await feedService.getTrendingReels();
      if (!reelsResult.data || reelsResult.data.reels.length === 0) {
        throw new Error("No reels to test save");
      }
      const reelId = reelsResult.data.reels[0].id;
      const result = await feedService.toggleSaveReel(reelId);
      if (!result.success) {
        throw new Error("Failed to toggle save");
      }
      return {
        message: `✓ Successfully toggled save on reel ${reelId}`,
        data: { reelId, saved: result.data?.isSaved },
      };
    });
  }

  private async testErrorHandling() {
    console.log("\n⚠️ TESTING ERROR HANDLING\n");

    // Test 1: Parse network error
    await this.runTest("Error Handler", "Parse Network Error", async () => {
      const error = new Error("Network Error");
      (error as any).code = "NETWORK_ERROR";
      const parsed = ErrorHandler.parseError(error);
      if (parsed.type !== "network" || !parsed.shouldUseMockData) {
        throw new Error("Network error not properly categorized");
      }
      return {
        message: `✓ Network error correctly categorized`,
        data: { errorType: parsed.type, shouldUseMock: parsed.shouldUseMockData },
      };
    });

    // Test 2: Parse timeout error
    await this.runTest("Error Handler", "Parse Timeout Error", async () => {
      const error = new Error("Request timeout");
      const parsed = ErrorHandler.parseError(error);
      if (parsed.type !== "timeout") {
        throw new Error("Timeout error not properly categorized");
      }
      return {
        message: `✓ Timeout error correctly categorized`,
        data: { errorType: parsed.type },
      };
    });

    // Test 3: Get user message
    await this.runTest("Error Handler", "Get User Message", async () => {
      const error = new Error("Network Error");
      (error as any).code = "NETWORK_ERROR";
      const parsed = ErrorHandler.parseError(error);
      const message = ErrorHandler.getUserMessage(parsed);
      if (!message || message.length === 0) {
        throw new Error("No user message generated");
      }
      return {
        message: `✓ User message generated: "${message}"`,
        data: { userMessage: message },
      };
    });
  }

  private async runTest(
    category: string,
    testName: string,
    testFn: () => Promise<{ message: string; data?: any }>
  ) {
    const startTime = Date.now();
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;

      console.log(`  ✅ ${testName}`);
      console.log(`     ${result.message}`);
      console.log(`     ⏱️  ${duration}ms\n`);

      this.results.push({
        feature: category,
        test: testName,
        passed: true,
        message: result.message,
        duration,
        data: result.data,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;

      console.log(`  ❌ ${testName}`);
      console.log(`     Error: ${error.message}`);
      console.log(`     ⏱️  ${duration}ms\n`);

      this.results.push({
        feature: category,
        test: testName,
        passed: false,
        message: error.message,
        duration,
      });
    }
  }

  private printResults() {
    console.log("\n" + "=".repeat(80));
    console.log("📊 TEST RESULTS SUMMARY\n");

    const grouped = this.results.reduce(
      (acc, result) => {
        if (!acc[result.feature]) {
          acc[result.feature] = [];
        }
        acc[result.feature].push(result);
        return acc;
      },
      {} as Record<string, TestResult[]>
    );

    let totalPassed = 0;
    let totalTests = 0;

    for (const [feature, tests] of Object.entries(grouped)) {
      const passed = tests.filter((t) => t.passed).length;
      const total = tests.length;
      totalPassed += passed;
      totalTests += total;

      const percentage = Math.round((passed / total) * 100);
      const status = percentage === 100 ? "✅" : "⚠️";

      console.log(`${status} ${feature}: ${passed}/${total} passed (${percentage}%)`);
      console.log(`   Total time: ${tests.reduce((sum, t) => sum + t.duration, 0)}ms`);
      console.log("");
    }

    console.log("=" + "=".repeat(79));
    const overallPercentage = Math.round((totalPassed / totalTests) * 100);
    const overallStatus = overallPercentage === 100 ? "✅" : "⚠️";

    console.log(`\n${overallStatus} OVERALL: ${totalPassed}/${totalTests} tests passed (${overallPercentage}%)\n`);

    if (totalPassed === totalTests) {
      console.log("🎉 ALL TESTS PASSED! All features are working with mock data.\n");
    } else {
      console.log(`⚠️ ${totalTests - totalPassed} test(s) failed. Check logs above.\n`);
    }

    return {
      totalPassed,
      totalTests,
      percentage: overallPercentage,
      results: this.results,
    };
  }

  /**
   * Export test results as JSON
   */
  getResults() {
    return {
      totalTests: this.results.length,
      totalPassed: this.results.filter((r) => r.passed).length,
      totalDuration: this.results.reduce((sum, r) => sum + r.duration, 0),
      results: this.results,
    };
  }
}

// Export singleton instance
const testFeatures = new TestFeatures();

// Make globally available for console testing
if (typeof global !== "undefined") {
  (global as any).__TEST_FEATURES__ = testFeatures;
}

export default testFeatures;
