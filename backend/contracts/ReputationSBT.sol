// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationSBT
 * @notice Soulbound Token de reputación no-transferible para nodos de NodeMesh
 */
contract ReputationSBT is ERC721, Ownable {
    // ─── Structs ────────────────────────────────────────────────────────────

    struct Reputation {
        uint256 score;
        uint256 totalSessions;
        uint256 lastUpdated;
    }

    // ─── State ──────────────────────────────────────────────────────────────

    uint256 private _tokenIdCounter;

    mapping(address => uint256)    public nodeToTokenId;
    mapping(uint256 => Reputation) public tokenReputation;
    mapping(address => bool)       public authorizedUpdaters;

    // ─── Events ─────────────────────────────────────────────────────────────

    event ReputationMinted(address indexed node, uint256 tokenId, uint256 initialScore);
    event ReputationUpdated(address indexed node, uint256 newScore, uint256 totalSessions);
    event UpdaterAuthorized(address indexed updater);
    event UpdaterRevoked(address indexed updater);

    // ─── Errors ─────────────────────────────────────────────────────────────

    error SoulboundToken();
    error NodeAlreadyHasSBT();
    error NodeHasNoSBT();
    error NotAuthorized();

    // ─── Constructor ────────────────────────────────────────────────────────

    constructor() ERC721("NodeMesh Reputation", "NMREP") Ownable(msg.sender) {}

    // ─── Soulbound: bloquear transferencias ─────────────────────────────────

    function transferFrom(address, address, uint256) public pure override {
        revert SoulboundToken();
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert SoulboundToken();
    }

    // ─── Admin ──────────────────────────────────────────────────────────────

    function authorizeUpdater(address _updater) external onlyOwner {
        authorizedUpdaters[_updater] = true;
        emit UpdaterAuthorized(_updater);
    }

    function revokeUpdater(address _updater) external onlyOwner {
        authorizedUpdaters[_updater] = false;
        emit UpdaterRevoked(_updater);
    }

    // ─── Functions ──────────────────────────────────────────────────────────

    function mint(address _node, uint256 _initialScore) external onlyOwner {
        if (nodeToTokenId[_node] != 0) revert NodeAlreadyHasSBT();

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(_node, tokenId);

        nodeToTokenId[_node] = tokenId;
        tokenReputation[tokenId] = Reputation({
            score:         _initialScore,
            totalSessions: 0,
            lastUpdated:   block.timestamp
        });

        emit ReputationMinted(_node, tokenId, _initialScore);
    }

    function updateScore(address _node, uint256 _scoreDelta, bool _increase) external {
        if (!authorizedUpdaters[msg.sender] && msg.sender != owner()) revert NotAuthorized();

        uint256 tokenId = nodeToTokenId[_node];
        if (tokenId == 0) revert NodeHasNoSBT();

        Reputation storage rep = tokenReputation[tokenId];

        if (_increase) {
            rep.score += _scoreDelta;
        } else {
            rep.score = rep.score > _scoreDelta ? rep.score - _scoreDelta : 0;
        }

        rep.totalSessions += 1;
        rep.lastUpdated    = block.timestamp;

        emit ReputationUpdated(_node, rep.score, rep.totalSessions);
    }

    function burn(address _node) external onlyOwner {
        uint256 tokenId = nodeToTokenId[_node];
        if (tokenId == 0) revert NodeHasNoSBT();

        delete nodeToTokenId[_node];
        delete tokenReputation[tokenId];

        _burn(tokenId);
    }

    function getReputation(address _node) external view returns (Reputation memory) {
        uint256 tokenId = nodeToTokenId[_node];
        if (tokenId == 0) revert NodeHasNoSBT();
        return tokenReputation[tokenId];
    }

    function hasReputation(address _node) external view returns (bool) {
        return nodeToTokenId[_node] != 0;
    }
}