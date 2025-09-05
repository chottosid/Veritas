// Data integrity utilities to ensure no information is lost during workflow transitions

/**
 * Validates that all required data is present during complaint to FIR conversion
 */
export const validateComplaintToFIRTransfer = (complaint, firData) => {
  const issues = [];
  
  // Check if complaint has accused persons
  if (!complaint.accused || complaint.accused.length === 0) {
    issues.push("WARNING: Complaint has no accused persons");
  }
  
  // Check if complaint has attachments/evidence
  if (!complaint.attachments || complaint.attachments.length === 0) {
    issues.push("WARNING: Complaint has no evidence/attachments");
  }
  
  // Validate FIR data
  if (!firData.firNumber) {
    issues.push("ERROR: FIR number is required");
  }
  
  if (!firData.sections || firData.sections.length === 0) {
    issues.push("ERROR: Legal sections are required for FIR");
  }
  
  return {
    isValid: issues.filter(issue => issue.startsWith("ERROR")).length === 0,
    issues: issues
  };
};

/**
 * Validates that all required data is present during FIR to Case conversion
 */
export const validateFIRToCaseTransfer = (fir, caseData) => {
  const issues = [];
  
  // Check if FIR has accused persons
  if (!fir.accused || fir.accused.length === 0) {
    issues.push("WARNING: FIR has no accused persons");
  }
  
  // Check if FIR has attachments/evidence
  if (!fir.attachments || fir.attachments.length === 0) {
    issues.push("WARNING: FIR has no evidence/attachments");
  }
  
  // Check if complaint (via FIR) has accused persons
  if (!fir.complaintId?.accused || fir.complaintId.accused.length === 0) {
    issues.push("WARNING: Original complaint has no accused persons");
  }
  
  // Check if complaint (via FIR) has attachments
  if (!fir.complaintId?.attachments || fir.complaintId.attachments.length === 0) {
    issues.push("WARNING: Original complaint has no evidence/attachments");
  }
  
  // Validate case data
  if (!caseData.caseNumber) {
    issues.push("ERROR: Case number is required");
  }
  
  return {
    isValid: issues.filter(issue => issue.startsWith("ERROR")).length === 0,
    issues: issues
  };
};

/**
 * Ensures all accused persons are properly transferred and deduplicated
 */
export const consolidateAccusedPersons = (complaintAccused = [], firAccused = [], caseAccused = []) => {
  const allAccused = [...complaintAccused, ...firAccused, ...caseAccused];
  
  // Deduplicate by name and address combination
  const uniqueAccused = allAccused.filter(
    (accused, index, self) =>
      index ===
      self.findIndex(
        (a) => a.name === accused.name && a.address === accused.address
      )
  );
  
  return uniqueAccused;
};

/**
 * Ensures all evidence/attachments are properly transferred and deduplicated
 */
export const consolidateEvidence = (complaintAttachments = [], firAttachments = [], caseAttachments = []) => {
  const allAttachments = [
    ...complaintAttachments.map(att => ({ ...att, source: "COMPLAINT" })),
    ...firAttachments.map(att => ({ ...att, source: "FIR" })),
    ...caseAttachments.map(att => ({ ...att, source: "CASE" }))
  ];
  
  // Deduplicate by IPFS hash
  const uniqueAttachments = allAttachments.filter(
    (attachment, index, self) =>
      index === self.findIndex((a) => a.ipfsHash === attachment.ipfsHash)
  );
  
  return uniqueAttachments;
};

/**
 * Creates a comprehensive data transfer report
 */
export const generateDataTransferReport = (sourceData, targetData, transferType) => {
  const report = {
    transferType,
    timestamp: new Date().toISOString(),
    sourceData: {
      accusedCount: sourceData.accused?.length || 0,
      evidenceCount: sourceData.attachments?.length || 0,
      hasComplaintData: !!sourceData.complaintId,
    },
    targetData: {
      accusedCount: targetData.accused?.length || 0,
      evidenceCount: targetData.attachments?.length || 0,
    },
    dataIntegrity: {
      accusedTransferred: (targetData.accused?.length || 0) >= (sourceData.accused?.length || 0),
      evidenceTransferred: (targetData.attachments?.length || 0) >= (sourceData.attachments?.length || 0),
    }
  };
  
  return report;
};

/**
 * Validates data completeness across the entire workflow
 */
export const validateWorkflowDataIntegrity = async (caseId, Case, FIR, Complaint) => {
  try {
    const caseData = await Case.findById(caseId)
      .populate({
        path: "firId",
        populate: {
          path: "complaintId",
          select: "accused attachments"
        }
      });
    
    if (!caseData) {
      return { isValid: false, error: "Case not found" };
    }
    
    const fir = caseData.firId;
    const complaint = fir.complaintId;
    
    const report = {
      caseId: caseData._id,
      caseNumber: caseData.caseNumber,
      dataFlow: {
        complaint: {
          accusedCount: complaint.accused?.length || 0,
          evidenceCount: complaint.attachments?.length || 0,
        },
        fir: {
          accusedCount: fir.accused?.length || 0,
          evidenceCount: fir.attachments?.length || 0,
        },
        case: {
          accusedCount: caseData.accused?.length || 0,
          evidenceCount: caseData.attachments?.length || 0,
        }
      },
      integrity: {
        accusedPreserved: (caseData.accused?.length || 0) >= (complaint.accused?.length || 0),
        evidencePreserved: (caseData.attachments?.length || 0) >= (complaint.attachments?.length || 0),
        firDataIncluded: (caseData.accused?.length || 0) >= (fir.accused?.length || 0),
      }
    };
    
    return {
      isValid: report.integrity.accusedPreserved && report.integrity.evidencePreserved,
      report
    };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
};
