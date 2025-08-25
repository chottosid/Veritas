import axios from "axios";
import FormData from "form-data";

// Upload file to Pinata IPFS
export const uploadToIPFS = async (fileBuffer, fileName) => {
  try {
    const formData = new FormData();
    formData.append("file", fileBuffer, fileName);

    const pinataMetadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        fileType: "complaint_attachment",
      },
    });
    formData.append("pinataMetadata", pinataMetadata);

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
          pinata_api_key: process.env.PINATA_API_Key,
          pinata_secret_api_key: process.env.PINATA_API_Secret,
        },
      }
    );

    return {
      success: true,
      ipfsHash: response.data.IpfsHash,
      pinSize: response.data.PinSize,
    };
  } catch (error) {
    console.error("IPFS upload error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

// Get file from IPFS
export const getFromIPFS = (ipfsHash) => {
  return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
};

// Create notification utility function
export const createNotification = async (Notification, {
  recipientId,
  recipientType,
  title,
  message,
  type,
  caseId = null,
  complaintId = null,
  firId = null,
  metadata = null,
}) => {
  try {
    const notification = new Notification({
      recipientId,
      recipientType,
      title,
      message,
      type,
      caseId,
      complaintId,
      firId,
      metadata,
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
};

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