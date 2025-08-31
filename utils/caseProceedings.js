// Append case proceeding helper
export const appendCaseProceeding = async (CaseProceeding, payload) => {
  try {
    const proceeding = new CaseProceeding(payload);
    await proceeding.save();
    return proceeding;
  } catch (error) {
    console.error("Failed to append case proceeding:", error);
    return null;
  }
};

