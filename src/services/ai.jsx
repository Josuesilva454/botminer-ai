export function analyzeMineral(mineral) {

    const purity =
        Number(mineral.purity || 0);

    const weight =
        Number(mineral.weight || 0);

    const estimatedValue =
        Number(mineral.estimatedValue || 0);


    let score = 50;

    const findings = [];


    /*
     * ==========================================
     * PURITY
     * ==========================================
     */

    if (purity >= 90) {

        score += 30;

        findings.push({
            type: "positive",
            message:
                "High mineral purity."
        });

    } else if (purity >= 70) {

        score += 20;

        findings.push({
            type: "positive",
            message:
                "Good mineral purity."
        });

    } else if (purity >= 50) {

        score += 10;

        findings.push({
            type: "warning",
            message:
                "Medium mineral purity."
        });

    } else {

        score -= 10;

        findings.push({
            type: "risk",
            message:
                "Low mineral purity."
        });
    }


    /*
     * ==========================================
     * WEIGHT
     * ==========================================
     */

    if (weight > 0) {

        score += 5;

        findings.push({
            type: "positive",
            message:
                "Mineral weight provided."
        });

    } else {

        score -= 10;

        findings.push({
            type: "risk",
            message:
                "Mineral weight is missing."
        });
    }


    /*
     * ==========================================
     * DOCUMENT
     * ==========================================
     */

    if (mineral.documentHash) {

        score += 15;

        findings.push({
            type: "positive",
            message:
                "Document CID is available on IPFS."
        });

    } else {

        score -= 20;

        findings.push({
            type: "risk",
            message:
                "No document CID was provided."
        });
    }


    /*
     * ==========================================
     * ESTIMATED VALUE
     * ==========================================
     */

    if (estimatedValue > 0) {

        score += 5;

        findings.push({
            type: "positive",
            message:
                "Estimated asset value provided."
        });

    } else {

        score -= 5;

        findings.push({
            type: "warning",
            message:
                "Estimated asset value is missing."
        });
    }


    /*
     * ==========================================
     * SCORE LIMIT
     * ==========================================
     */

    score =
        Math.max(
            0,
            Math.min(
                100,
                score
            )
        );


    /*
     * ==========================================
     * RISK
     * ==========================================
     */

    let riskLevel;

    if (score >= 80) {

        riskLevel = "LOW";

    } else if (score >= 60) {

        riskLevel = "MEDIUM";

    } else {

        riskLevel = "HIGH";
    }


    /*
     * ==========================================
     * RECOMMENDATION
     * ==========================================
     */

    let recommendation;

    if (score >= 80) {

        recommendation =
            "Asset can proceed to tokenization.";

    } else if (score >= 60) {

        recommendation =
            "Additional verification is recommended.";

    } else {

        recommendation =
            "Asset should be reviewed before tokenization.";
    }


    /*
     * ==========================================
     * ANALYSIS REPORT
     * ==========================================
     */

    const analysis = {

        mineral:
            mineral.mineralType,

        origin:
            mineral.origin,

        purity,

        weight,

        estimatedValue,

        documentAvailable:
            Boolean(
                mineral.documentHash
            ),

        findings

    };


    return {

        aiScore:
            score,

        riskLevel,

        recommendation,

        analysis

    };
}