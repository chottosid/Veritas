// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract JusticeEvents {
    event ComplaintFiled(
        bytes32 indexed complaintId,
        address indexed actor,
        string title,
        string area,
        string ipfsSummary
    );

    event FIRRegistered(
        bytes32 indexed complaintId,
        bytes32 indexed firId,
        address indexed actor,
        string firNumber,
        string sections
    );

    event CaseCreated(
        bytes32 indexed firId,
        bytes32 indexed caseId,
        address indexed actor,
        string caseNumber
    );

    event CaseUpdated(
        bytes32 indexed caseId,
        address indexed actor,
        string updateType,
        string description
    );

    function emitComplaintFiled(
        bytes32 complaintId,
        string calldata title,
        string calldata area,
        string calldata ipfsSummary
    ) external {
        emit ComplaintFiled(complaintId, msg.sender, title, area, ipfsSummary);
    }

    function emitFIRRegistered(
        bytes32 complaintId,
        bytes32 firId,
        string calldata firNumber,
        string calldata sections
    ) external {
        emit FIRRegistered(complaintId, firId, msg.sender, firNumber, sections);
    }

    function emitCaseCreated(
        bytes32 firId,
        bytes32 caseId,
        string calldata caseNumber
    ) external {
        emit CaseCreated(firId, caseId, msg.sender, caseNumber);
    }

    function emitCaseUpdated(
        bytes32 caseId,
        string calldata updateType,
        string calldata description
    ) external {
        emit CaseUpdated(caseId, msg.sender, updateType, description);
    }
}


