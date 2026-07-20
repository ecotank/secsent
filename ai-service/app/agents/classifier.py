import re
from app.schemas.contracts import ClassifierRequest, ClassifierResponse


class MLDocumentClassifierAgent:
    """Agent 1: ML Document Classifier Agent (Fast NLP Categorization)"""

    def __init__(self):
        self.category_keywords = {
            "SURAT_UNDANGAN": ["rapat", "menghadiri", "undangan", "pertemuan", "agenda", "jadwal"],
            "NOTA_DINAS": ["nota", "permohonan", "anggaran", "pengadaan", "laporan", "kegiatan"],
            "SURAT_EDARAN": ["edaran", "himbauan", "pemberitahuan", "kebijakan", "instruksi", "seluruh"],
            "SURAT_KEPUTUSAN": ["menetapkan", "keputusan", "memutuskan", "pengangkatan", "sk"]
        }

    def classify(self, request: ClassifierRequest) -> ClassifierResponse:
        text_lower = request.raw_text_content.lower()

        scores = {cat: 0 for cat in self.category_keywords}
        for cat, keywords in self.category_keywords.items():
            for kw in keywords:
                if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
                    scores[cat] += 1

        predicted_cat = max(scores, key=scores.get)
        confidence = 0.95 if scores[predicted_cat] > 0 else 0.70

        # Urgency prediction based on keywords
        urgency = "BIASA"
        if any(w in text_lower for w in ["segera", "urgent", "penting", "darurat"]):
            urgency = "SEGERA"
        if any(w in text_lower for w in ["amat segera", "sangat penting", "hari ini"]):
            urgency = "AMAT_SEGERA"

        return ClassifierResponse(
            letter_id=request.letter_id,
            predicted_category=predicted_cat,
            confidence_score=confidence,
            predicted_urgency=urgency
        )
