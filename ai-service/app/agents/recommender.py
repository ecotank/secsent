from app.schemas.contracts import RecommenderRequest, RecommenderResponse


class SecurityRecommenderAgent:
    """Agent 4: Security Recommender Agent (Classification & Encryption Advisory)"""

    def recommend(self, request: RecommenderRequest) -> RecommenderResponse:
        risk_score = request.risk_output.get("risk_score", 0.0)
        risk_level = request.risk_output.get("risk_level", "LOW")

        recommended_class = "BIASA"
        required_encryption = "HYBRID_AES_256_GCM_X25519"
        disposition_restriction = "NONE"
        action_summary = "Dokumen tidak mendeteksi konten berisiko tinggi. Klasifikasi direkomendasikan BIASA."

        if risk_score >= 7.0 or risk_level == "HIGH":
            recommended_class = "RAHASIA"
            disposition_restriction = "RESTRICT_TO_UNIT_HEAD_ONLY"
            action_summary = f"Surat direkomendasikan naik klasifikasi menjadi RAHASIA karena skor risiko kebocoran data tinggi ({risk_score:.2f})."
        elif risk_score >= 4.0 or risk_level == "MEDIUM":
            recommended_class = "TERBATAS"
            disposition_restriction = "RESTRICT_TO_INTERNAL_UNIT"
            action_summary = f"Surat direkomendasikan klasifikasi TERBATAS (skor risiko: {risk_score:.2f})."

        return RecommenderResponse(
            letter_id=request.letter_id,
            recommended_classification=recommended_class,
            required_encryption=required_encryption,
            disposition_restriction=disposition_restriction,
            action_summary=action_summary
        )
