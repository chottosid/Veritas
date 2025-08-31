// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract JusticeEvents {
    // Enhanced event structure with more metadata
    event ComplaintFiled(
        bytes32 indexed complaintId,
        address indexed actor,
        string title,
        string area,
        string ipfsSummary,
        uint256 timestamp,
        string complainantName
    );

    event FIRRegistered(
        bytes32 indexed complaintId,
        bytes32 indexed firId,
        address indexed actor,
        string firNumber,
        string sections,
        uint256 timestamp,
        string investigatingOfficer
    );

    event CaseCreated(
        bytes32 indexed firId,
        bytes32 indexed caseId,
        address indexed actor,
        string caseNumber,
        uint256 timestamp,
        string assignedJudge
    );

    event CaseUpdated(
        bytes32 indexed caseId,
        address indexed actor,
        string updateType,
        string description,
        uint256 timestamp,
        string metadata
    );

    event EvidenceSubmitted(
        bytes32 indexed caseId,
        bytes32 indexed evidenceId,
        address indexed submitter,
        string evidenceType,
        string ipfsHash,
        uint256 timestamp,
        string description
    );

    event CaseStatusChanged(
        bytes32 indexed caseId,
        address indexed actor,
        string oldStatus,
        string newStatus,
        uint256 timestamp,
        string reason
    );

    event JudgmentPassed(
        bytes32 indexed caseId,
        address indexed judge,
        string verdict,
        string ipfsHash,
        uint256 timestamp,
        string reasoning
    );

    // Case metadata storage for transparency
    mapping(bytes32 => CaseMetadata) public caseMetadata;
    mapping(bytes32 => Evidence[]) public caseEvidence;
    mapping(bytes32 => CaseUpdate[]) public caseUpdates;

    struct CaseMetadata {
        string caseNumber;
        string status;
        uint256 createdAt;
        uint256 lastUpdated;
        string assignedJudge;
        string investigatingOfficer;
        bool isActive;
    }

    struct Evidence {
        bytes32 evidenceId;
        string evidenceType;
        string ipfsHash;
        address submitter;
        uint256 timestamp;
        string description;
        bool isVerified;
    }

    struct CaseUpdate {
        string updateType;
        string description;
        address actor;
        uint256 timestamp;
        string metadata;
    }

    // Access control
    mapping(address => bool) public authorizedUsers;
    address public owner;

    constructor() {
        owner = msg.sender;
        authorizedUsers[msg.sender] = true;
    }

    modifier onlyAuthorized() {
        require(authorizedUsers[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    function addAuthorizedUser(address user) external onlyOwner {
        authorizedUsers[user] = true;
    }

    function removeAuthorizedUser(address user) external onlyOwner {
        require(user != owner, "Cannot remove owner");
        authorizedUsers[user] = false;
    }

    // Enhanced event emission functions
    function emitComplaintFiled(
        bytes32 complaintId,
        string calldata title,
        string calldata area,
        string calldata ipfsSummary,
        string calldata complainantName
    ) external onlyAuthorized {
        emit ComplaintFiled(
            complaintId,
            msg.sender,
            title,
            area,
            ipfsSummary,
            block.timestamp,
            complainantName
        );
    }

    function emitFIRRegistered(
        bytes32 complaintId,
        bytes32 firId,
        string calldata firNumber,
        string calldata sections,
        string calldata investigatingOfficer
    ) external onlyAuthorized {
        emit FIRRegistered(
            complaintId,
            firId,
            msg.sender,
            firNumber,
            sections,
            block.timestamp,
            investigatingOfficer
        );
    }

    function emitCaseCreated(
        bytes32 firId,
        bytes32 caseId,
        string calldata caseNumber,
        string calldata assignedJudge
    ) external onlyAuthorized {
        caseMetadata[caseId] = CaseMetadata({
            caseNumber: caseNumber,
            status: "ACTIVE",
            createdAt: block.timestamp,
            lastUpdated: block.timestamp,
            assignedJudge: assignedJudge,
            investigatingOfficer: "",
            isActive: true
        });

        emit CaseCreated(
            firId,
            caseId,
            msg.sender,
            caseNumber,
            block.timestamp,
            assignedJudge
        );
    }

    function emitCaseUpdated(
        bytes32 caseId,
        string calldata updateType,
        string calldata description,
        string calldata metadata
    ) external onlyAuthorized {
        require(caseMetadata[caseId].isActive, "Case not found or inactive");

        caseMetadata[caseId].lastUpdated = block.timestamp;
        
        caseUpdates[caseId].push(CaseUpdate({
            updateType: updateType,
            description: description,
            actor: msg.sender,
            timestamp: block.timestamp,
            metadata: metadata
        }));

        emit CaseUpdated(
            caseId,
            msg.sender,
            updateType,
            description,
            block.timestamp,
            metadata
        );
    }

    function emitEvidenceSubmitted(
        bytes32 caseId,
        bytes32 evidenceId,
        string calldata evidenceType,
        string calldata ipfsHash,
        string calldata description
    ) external onlyAuthorized {
        require(caseMetadata[caseId].isActive, "Case not found or inactive");

        caseEvidence[caseId].push(Evidence({
            evidenceId: evidenceId,
            evidenceType: evidenceType,
            ipfsHash: ipfsHash,
            submitter: msg.sender,
            timestamp: block.timestamp,
            description: description,
            isVerified: false
        }));

        emit EvidenceSubmitted(
            caseId,
            evidenceId,
            msg.sender,
            evidenceType,
            ipfsHash,
            block.timestamp,
            description
        );
    }

    function emitCaseStatusChanged(
        bytes32 caseId,
        string calldata oldStatus,
        string calldata newStatus,
        string calldata reason
    ) external onlyAuthorized {
        require(caseMetadata[caseId].isActive, "Case not found or inactive");

        caseMetadata[caseId].status = newStatus;
        caseMetadata[caseId].lastUpdated = block.timestamp;

        emit CaseStatusChanged(
            caseId,
            msg.sender,
            oldStatus,
            newStatus,
            block.timestamp,
            reason
        );
    }

    function emitJudgmentPassed(
        bytes32 caseId,
        string calldata verdict,
        string calldata ipfsHash,
        string calldata reasoning
    ) external onlyAuthorized {
        require(caseMetadata[caseId].isActive, "Case not found or inactive");

        caseMetadata[caseId].status = "CLOSED";
        caseMetadata[caseId].lastUpdated = block.timestamp;

        emit JudgmentPassed(
            caseId,
            msg.sender,
            verdict,
            ipfsHash,
            block.timestamp,
            reasoning
        );
    }

    // View functions for transparency
    function getCaseMetadata(bytes32 caseId) external view returns (CaseMetadata memory) {
        return caseMetadata[caseId];
    }

    function getCaseEvidence(bytes32 caseId) external view returns (Evidence[] memory) {
        return caseEvidence[caseId];
    }

    function getCaseUpdates(bytes32 caseId) external view returns (CaseUpdate[] memory) {
        return caseUpdates[caseId];
    }

    function getCaseEvidenceCount(bytes32 caseId) external view returns (uint256) {
        return caseEvidence[caseId].length;
    }

    function getCaseUpdateCount(bytes32 caseId) external view returns (uint256) {
        return caseUpdates[caseId].length;
    }
}


