// src/utils/generateCertificate.js
import { PDFDocument, StandardFonts } from "pdf-lib";


/**
 * generateCertificatePdf
 * - Fills the provided PDF template with member data and triggers a download.
 * - Returns a Promise that resolves to the generated Blob.
 *
 * @param {Object} memberData - expected keys: membershipId, flatNumber, ownerName, coOwnerName
 *                              (falls back to ownerNameMasked / coOwnerNameMasked if full names not present)
 * @param {Object} options - optional:
 *    - templatePath: string (URL path to template; default "/certificate.pdf")
 *    - positions: object to override x/y/size/maxWidth for fields
 *    - filenamePrefix: optional string prepended to filename
 */

// Util 
function changeMemberId(str) {
  const [first, ...rest] = str.split('/');
   return [...rest, first].join('/')
}


export async function generateCertificatePdf(memberData, options = {}) {
  if (!memberData) throw new Error("memberData is required");

  const {
    templatePath = "/aoacertificate.pdf",
    positions = {
      membershipId: { x: 400, y: 326, size: 13, maxWidth: 200 }, // membership ID line
      ownerName: { x: 233, y: 235, size: 18, maxWidth: 220 }, // left owner
      coOwnerName: { x: 497, y: 235, size: 18, maxWidth: 220 }, // right co-owner
      flatNumber: { x: 240, y: 100, size: 14, maxWidth: 120 }, // "Flat No ...."
      tower: { x: 390, y: 100, size: 14, maxWidth: 80 }, // "Tower ...."
      issuedDate: { x: 657, y: 120, size: 13, maxWidth: 180 }, // bottom right
    },
    filenamePrefix = "",
  } = options;

  function isMeaningfulName(str) {
    if (!str) return false;
    const s = String(str).trim();
    if (!s) return false;

    // remove ALL non-alphanumeric chars (so "N*A", "N/A", " n a " -> "na")
    const normalized = s.replace(/[^a-z0-9]/gi, "").toLowerCase();

    if (!normalized) return false;
    const placeholders = new Set(["na", "0", "none"]);
    return !placeholders.has(normalized);
  }

  try {
    // 1) Load template bytes
    const resp = await fetch(templatePath);
    if (!resp.ok) throw new Error(`Failed to fetch template at ${templatePath}`);
    const arrayBuffer = await resp.arrayBuffer();

    // 2) Load PDF document
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const page = pages[0];

    // 3) Embed font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // 4) Prepare values (preferring full names where available)
    const membershipId = memberData.membershipId || memberData.membershipIdMasked || "N/A";
    const revMemberShipId = changeMemberId(membershipId);
    const flatNumber = memberData.flatNumber.split("-")[1].slice(1) || "N/A";
    const tower = memberData.flatNumber && String(memberData.flatNumber).includes("-") ? String(memberData.flatNumber).split("-")[0] : "N/A";
    const ownerName = memberData.ownerName || memberData.ownerNameMasked || "N/A";
    const rawCoOwner = memberData.coOwnerName || memberData.coOwnerNameMasked || "";

    // Helper: draw wrapped text
    function drawWrappedText(page, text, { x, y, size, maxWidth, lineHeight = null }) {
      if (!text) return;
      const words = String(text).split(/\s+/);
      let line = "";
      const actualLineHeight = lineHeight || size * 1.15;
      let cursorY = y;

      for (let i = 0; i < words.length; i++) {
        const testLine = line ? `${line} ${words[i]}` : words[i];
        const width = font.widthOfTextAtSize(testLine, size);

        if (width <= maxWidth) {
          line = testLine;
        } else {
          // draw current line, start new
          if (line) {
            page.drawText(line, { x, y: cursorY, size, font });
            cursorY -= actualLineHeight;
          }
          line = words[i];
        }
      }
      // draw remainder
      if (line) {
        page.drawText(line, { x, y: cursorY, size, font });
      }
    }

    const issuedDate = new Date().toLocaleDateString();

    // 5) Draw fields
    drawWrappedText(page, revMemberShipId, positions.membershipId);
    drawWrappedText(page, ownerName, positions.ownerName);
    if (isMeaningfulName(true)) {
      drawWrappedText(page, rawCoOwner, positions.coOwnerName);
    }
    drawWrappedText(page, flatNumber, positions.flatNumber);
    drawWrappedText(page, tower, positions.tower);
    drawWrappedText(page, issuedDate, positions.issuedDate);
    // 6) Save and prepare download
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    // Trigger download (also return blob)
    const url = URL.createObjectURL(blob);
    const safeNameBase = (filenamePrefix || membershipId || flatNumber || "certificate").toString().replace(/\s+/g, "_");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeNameBase}-membership-certificate.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    return blob;
  } catch (err) {
    // bubble up error for caller to handle
    console.error("generateCertificatePdf error:", err);
    throw err;
  }
}
