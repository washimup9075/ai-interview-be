import { PDFParse } from "pdf-parse";
import { parseResumeWithAI } from "../utils/ai.js";

export const parseResume = async (req, res) => {
  try {
    let resumeText = req.body.resumeText || "";

    // If file was uploaded via multer
    if (req.file) {
      if (
        req.file.mimetype === "application/pdf" ||
        req.file.originalname?.toLowerCase().endsWith(".pdf")
      ) {
        try {
          const parser = new PDFParse({ data: req.file.buffer });
          const parsedPdf = await parser.getText();
          resumeText = parsedPdf?.text || "";
        } catch (pdfErr) {
          console.error("PDF parse error, using text fallback:", pdfErr);
          resumeText = req.file.buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
        }
      } else {
        // Plain text or UTF-8 doc string
        resumeText = req.file.buffer.toString("utf-8");
      }
    }

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "No resume content provided. Please upload a PDF or paste text.",
      });
    }

    // Process with Gemini AI
    const analysis = await parseResumeWithAI(resumeText);

    return res.status(200).json({
      success: true,
      message: "Resume processed successfully",
      resumeText,
      analysis,
    });
  } catch (error) {
    console.error("Error in parseResume controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to parse resume: " + error.message,
    });
  }
};
