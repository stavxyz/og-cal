const { describe, it, before } = require("node:test");
const assert = require("node:assert");

let extractAttachments,
  normalizeAttachmentUrl,
  deriveTypeFromMimeType,
  labelForType;

before(async () => {
  const mod = await import("../src/util/attachments.js");
  extractAttachments = mod.extractAttachments;
  normalizeAttachmentUrl = mod.normalizeAttachmentUrl;
  deriveTypeFromMimeType = mod.deriveTypeFromMimeType;
  labelForType = mod.labelForType;
});

describe("extractAttachments — basic extraction", () => {
  it("extracts a PDF URL from description", () => {
    const desc = "Download the flyer: https://example.com/flyer.pdf";
    const result = extractAttachments(desc);
    assert.strictEqual(result.attachments.length, 1);
    assert.strictEqual(result.attachments[0].label, "Download PDF");
    assert.strictEqual(
      result.attachments[0].url,
      "https://example.com/flyer.pdf",
    );
    assert.strictEqual(result.attachments[0].type, "pdf");
    assert.ok(!result.description.includes("example.com"));
  });

  it("extracts a .docx URL", () => {
    const desc = "Notes: https://example.com/notes.docx";
    const result = extractAttachments(desc);
    assert.strictEqual(result.attachments.length, 1);
    assert.strictEqual(result.attachments[0].label, "Download Document");
    assert.strictEqual(result.attachments[0].type, "docx");
  });

  it("extracts a .xlsx URL", () => {
    const desc = "Data: https://example.com/data.xlsx";
    const result = extractAttachments(desc);
    assert.strictEqual(result.attachments[0].label, "Download Spreadsheet");
    assert.strictEqual(result.attachments[0].type, "xlsx");
  });

  it("extracts a .pptx URL", () => {
    const desc = "Slides: https://example.com/slides.pptx";
    const result = extractAttachments(desc);
    assert.strictEqual(result.attachments[0].label, "Download Presentation");
    assert.strictEqual(result.attachments[0].type, "pptx");
  });

  it("extracts a .zip URL", () => {
    const desc = "Files: https://example.com/archive.zip";
    const result = extractAttachments(desc);
    assert.strictEqual(result.attachments[0].label, "Download Archive");
    assert.strictEqual(result.attachments[0].type, "zip");
  });

  it("extracts a .csv URL", () => {
    const desc = "Data: https://example.com/export.csv";
    const result = extractAttachments(desc);
    assert.strictEqual(result.attachments[0].label, "Download Spreadsheet");
    assert.strictEqual(result.attachments[0].type, "csv");
  });

  it("extracts a .txt URL", () => {
    const desc = "Read: https://example.com/readme.txt";
    const result = extractAttachments(desc);
    assert.strictEqual(result.attachments[0].label, "Download File");
    assert.strictEqual(result.attachments[0].type, "txt");
  });

  it("does not extract image URLs", () => {
    const desc = "Photo: https://example.com/photo.jpg";
    const result = extractAttachments(desc);
    assert.strictEqual(result.attachments.length, 0);
  });

  it("does not extract URLs without file extensions", () => {
    const desc = "Visit https://example.com/page for info";
    const result = extractAttachments(desc);
    assert.strictEqual(result.attachments.length, 0);
  });

  it("extracts multiple attachments", () => {
    const desc =
      "Docs: https://example.com/a.pdf and https://example.com/b.docx";
    const result = extractAttachments(desc);
    assert.strictEqual(result.attachments.length, 2);
  });

  it("returns empty for null description", () => {
    const result = extractAttachments(null);
    assert.deepStrictEqual(result.attachments, []);
    assert.strictEqual(result.description, null);
  });

  it("returns empty for empty string", () => {
    const result = extractAttachments("");
    assert.deepStrictEqual(result.attachments, []);
  });

  it("strips attachment URL from description", () => {
    const desc = "Get the report https://example.com/report.pdf here";
    const result = extractAttachments(desc);
    assert.ok(!result.description.includes("report.pdf"));
    assert.ok(result.description.includes("Get the report"));
  });

  it("strips <a>-wrapped attachment URL from description", () => {
    const url = "https://example.com/doc.pdf";
    const desc = `Download <a href="${url}">${url}</a> now`;
    const result = extractAttachments(desc);
    assert.strictEqual(result.attachments.length, 1);
    assert.ok(!result.description.includes("doc.pdf"));
  });
});

describe("extractAttachments — Dropbox normalization", () => {
  it("normalizes Dropbox PDF URL with dl=0 to raw=1", () => {
    const desc =
      "Flyer: https://www.dropbox.com/scl/fi/abc/report.pdf?rlkey=xyz&dl=0";
    const result = extractAttachments(desc);
    assert.strictEqual(
      result.attachments[0].url,
      "https://www.dropbox.com/scl/fi/abc/report.pdf?rlkey=xyz&raw=1",
    );
  });

  it("passes through dl.dropboxusercontent.com unchanged", () => {
    const url = "https://dl.dropboxusercontent.com/s/abc/doc.pdf";
    const desc = `Download: ${url}`;
    const result = extractAttachments(desc);
    assert.strictEqual(result.attachments[0].url, url);
  });
});

describe("extractAttachments — Drive normalization", () => {
  it("normalizes Drive file URL to download URL", () => {
    const desc = "Doc: https://drive.google.com/file/d/ABC123/view";
    const result = extractAttachments(desc);
    assert.strictEqual(result.attachments.length, 1);
    assert.strictEqual(
      result.attachments[0].url,
      "https://drive.google.com/uc?export=download&id=ABC123",
    );
    assert.strictEqual(result.attachments[0].type, "file");
    assert.strictEqual(result.attachments[0].label, "Download File");
  });
});

describe("normalizeAttachmentUrl", () => {
  it("normalizes Dropbox share URL", () => {
    const url = "https://www.dropbox.com/s/abc/doc.pdf?dl=0";
    assert.strictEqual(
      normalizeAttachmentUrl(url),
      "https://www.dropbox.com/s/abc/doc.pdf?raw=1",
    );
  });

  it("normalizes Drive URL to download link", () => {
    const url = "https://drive.google.com/file/d/XYZ/view";
    assert.strictEqual(
      normalizeAttachmentUrl(url),
      "https://drive.google.com/uc?export=download&id=XYZ",
    );
  });

  it("passes through other URLs unchanged", () => {
    const url = "https://example.com/doc.pdf";
    assert.strictEqual(normalizeAttachmentUrl(url), url);
  });
});

describe("deriveTypeFromMimeType", () => {
  it("returns pdf for application/pdf", () => {
    assert.strictEqual(deriveTypeFromMimeType("application/pdf"), "pdf");
  });

  it("returns doc for Word mime types", () => {
    assert.strictEqual(
      deriveTypeFromMimeType(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
      "doc",
    );
  });

  it("returns spreadsheet for Excel mime types", () => {
    assert.strictEqual(
      deriveTypeFromMimeType(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ),
      "spreadsheet",
    );
  });

  it("returns presentation for PowerPoint mime types", () => {
    assert.strictEqual(
      deriveTypeFromMimeType(
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ),
      "presentation",
    );
  });

  it("returns archive for zip mime type", () => {
    assert.strictEqual(deriveTypeFromMimeType("application/zip"), "archive");
  });

  it("returns file for unknown mime type", () => {
    assert.strictEqual(
      deriveTypeFromMimeType("application/octet-stream"),
      "file",
    );
  });

  it("returns file for null", () => {
    assert.strictEqual(deriveTypeFromMimeType(null), "file");
  });
});

describe("labelForType", () => {
  it('returns "Download PDF" for "pdf"', () => {
    assert.strictEqual(labelForType("pdf"), "Download PDF");
  });

  it('returns "Download Document" for "doc"', () => {
    assert.strictEqual(labelForType("doc"), "Download Document");
  });

  it('returns "Download Spreadsheet" for "spreadsheet"', () => {
    assert.strictEqual(labelForType("spreadsheet"), "Download Spreadsheet");
  });

  it('returns "Download Presentation" for "presentation"', () => {
    assert.strictEqual(labelForType("presentation"), "Download Presentation");
  });

  it('returns "Download Archive" for "archive"', () => {
    assert.strictEqual(labelForType("archive"), "Download Archive");
  });

  it('returns "Download File" for unknown type like "unknown"', () => {
    assert.strictEqual(labelForType("unknown"), "Download File");
  });
});
