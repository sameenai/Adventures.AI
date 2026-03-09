import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/logger";

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("in development (NODE_ENV !== 'production')", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "development");
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("logs info messages", () => {
      logger.info("test info");
      expect(console.info).toHaveBeenCalledOnce();
      const call = (console.info as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call).toContain("[INFO]");
      expect(call).toContain("test info");
    });

    it("logs warn messages", () => {
      logger.warn("test warning");
      expect(console.warn).toHaveBeenCalledOnce();
      const call = (console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call).toContain("[WARN]");
      expect(call).toContain("test warning");
    });

    it("logs error messages", () => {
      logger.error("test error");
      expect(console.error).toHaveBeenCalledOnce();
      const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call).toContain("[ERROR]");
      expect(call).toContain("test error");
    });

    it("includes data argument when provided", () => {
      const data = { key: "value" };
      logger.info("with data", data);
      expect(console.info).toHaveBeenCalledWith(expect.stringContaining("with data"), data);
    });

    it("does not include data argument when not provided", () => {
      logger.info("no data");
      const args = (console.info as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(args).toHaveLength(1);
    });

    it("includes ISO timestamp in log output", () => {
      logger.info("timestamp test");
      const call = (console.info as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("in production (NODE_ENV === 'production')", () => {
    it("logs warn in any environment", () => {
      logger.warn("prod warn");
      expect(console.warn).toHaveBeenCalledOnce();
    });

    it("logs error in any environment", () => {
      logger.error("prod error");
      expect(console.error).toHaveBeenCalledOnce();
    });

    it("suppresses info logs when NODE_ENV is production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.resetModules();
      const { logger: prodLogger } = await import("@/lib/logger");
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      prodLogger.info("should be suppressed");
      expect(infoSpy).not.toHaveBeenCalled();
      vi.unstubAllEnvs();
      vi.resetModules();
    });
  });
});
