import mongoose from "mongoose";
const { Schema } = mongoose;

// Citizen Schema
const citizenSchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    phone: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    nid: { type: String, unique: true, sparse: true, required: true },
    password: { type: String, required: true }, // Added password field
  },
  {
    timestamps: true,
  }
);

// Police Schema
const policeSchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    phone: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    pid: { type: String, required: true, unique: true, required: true },
    rank: { type: String, required: true },
    station: { type: String, required: true },
    isOC: { type: Boolean, default: false }, // Officer in Charge
    password: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Judge Schema
const judgeSchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    phone: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    courtName: { type: String, required: true },
    rank: { type: String, required: true },
    jid: { type: String, required: true, unique: true, sparse: true },
    password: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Lawyer Schema
const lawyerSchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    phone: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    firmName: { type: String },
    bid: { type: String, required: true, unique: true, sparse: true },
    password: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Complaint Schema
const complaintSchema = new Schema(
  {
    complainantId: {
      type: Schema.Types.ObjectId,
      ref: "Citizen",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    area: { type: String, required: true },
    assignedOfficerIds: [{ type: Schema.Types.ObjectId, ref: "Police" }],
    status: {
      type: String,
      enum: ["PENDING", "UNDER_INVESTIGATION", "FIR_REGISTERED", "CLOSED"],
      default: "PENDING",
    },
    attachments: [
      {
        fileName: String,
        ipfsHash: String,
        fileSize: Number,
        uploadedAt: { type: Date, default: Date.now },
      },
    ], // Multiple attachments support
  },
  {
    timestamps: true,
  }
);

// FIR Schema
const firSchema = new Schema(
  {
    complaintId: {
      type: Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
      unique: true,
    },
    firNumber: { type: String, required: true, unique: true },
    sections: [{ type: String, required: true }], // IPC sections
    registeredBy: {
      type: Schema.Types.ObjectId,
      ref: "Police",
      required: true,
    },
    submittedToJudge: { type: Schema.Types.ObjectId, ref: "Judge" },
    attachments: [
      {
        fileName: String,
        ipfsHash: String,
        fileSize: Number,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Lawyer Request Schema
const lawyerRequestSchema = new Schema(
  {
    citizenId: { type: Schema.Types.ObjectId, ref: "Citizen", required: true },
    caseId: { type: Schema.Types.ObjectId, ref: "Case" },
    requestedLawyerId: { type: Schema.Types.ObjectId, ref: "Lawyer" },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING",
    },
    message: { type: String },
  },
  {
    timestamps: true,
  }
);

// Case Schema
const caseSchema = new Schema(
  {
    firId: { type: Schema.Types.ObjectId, ref: "FIR", required: true },
    caseNumber: { type: String, required: true, unique: true },
    assignedJudgeId: { type: Schema.Types.ObjectId, ref: "Judge" },
    accusedLawyerId: { type: Schema.Types.ObjectId, ref: "Lawyer" },
    prosecutorLawyerId: { type: Schema.Types.ObjectId, ref: "Lawyer" },
    status: {
      type: String,
      enum: ["PENDING", "ONGOING", "CLOSED"],
      default: "PENDING",
    },
    hearingDates: [{ type: Date }],
    verdict: { type: String },
    investigatingOfficerIds: [{ type: Schema.Types.ObjectId, ref: "Police" }],
    ipfsHash: { type: String }, // IPFS hash for case documents
  },
  {
    timestamps: true,
  }
);

// Create Models
const Citizen = mongoose.model("Citizen", citizenSchema);
const Police = mongoose.model("Police", policeSchema);
const Judge = mongoose.model("Judge", judgeSchema);
const Lawyer = mongoose.model("Lawyer", lawyerSchema);
const Complaint = mongoose.model("Complaint", complaintSchema);
const FIR = mongoose.model("FIR", firSchema);
const LawyerRequest = mongoose.model("LawyerRequest", lawyerRequestSchema);
const Case = mongoose.model("Case", caseSchema);

export { Citizen, Police, Judge, Lawyer, Complaint, FIR, LawyerRequest, Case };
