import { describe, expect, it } from "vitest";
import { sanitizeDocxMarkdownForAi } from "../../src/main/services/markdown-cleanup";

describe("sanitizeDocxMarkdownForAi", () => {
  it("removes trailing heading attributes", () => {
    expect(sanitizeDocxMarkdownForAi("# 제목 {#_Toc193877886 .anchor}\n")).toBe("# 제목\n");
  });

  it("removes image attribute blocks", () => {
    expect(
      sanitizeDocxMarkdownForAi("![img](media/image1.png){width=\"6.2in\"\nheight=\"3in\"}\n")
    ).toBe("\n");
  });

  it("strips inline span attributes, standalone attribute lines, and comments", () => {
    expect(
      sanitizeDocxMarkdownForAi("[텍스트]{.mark}\n{#bookmark .anchor}\n<!-- note -->\n")
    ).toBe("텍스트\n");
  });

  it("removes inline toc anchors and image references from noisy docx output", () => {
    expect(
      sanitizeDocxMarkdownForAi(
        "[]{#_Toc193877820 .anchor}**대시보드** []{#_Toc193877821 .anchor}대시보드>대시보드![](media/image5.png)\n"
      )
    ).toBe("**대시보드** 대시보드>대시보드\n");
  });

  it("preserves link text while unwrapping docx toc links", () => {
    expect(
      sanitizeDocxMarkdownForAi("[1. 개요 [7](#_Toc193877818)](#_Toc193877818)\n")
    ).toBe("1. 개요\n");
  });

  it("cleans docx toc blocks without leaving dangling anchors", () => {
    const input = [
      "# 목차 {#목차 .TOC-제목1}",
      "",
      "[1. 개요 [7](#_Toc193877818)](#_Toc193877818)",
      "",
      "[0.0 로그인 [8](#_Toc193877819)](#_Toc193877819)",
      "",
      "[1.2.4 사용자/출입증 관리>출입 권한 설정",
      "[20](#_Toc193877832)](#_Toc193877832)1.3 사용자/출입증 관리>출입 권한",
      "설정 20"
    ].join("\n");

    const result = sanitizeDocxMarkdownForAi(input);

    expect(result).toContain("# 목차\n");
    expect(result).toContain("1. 개요\n");
    expect(result).toContain("0.0 로그인\n");
    expect(result).toContain("1.2.4 사용자/출입증 관리>출입 권한 설정\n");
    expect(result).not.toContain("](#_Toc");
  });
});
