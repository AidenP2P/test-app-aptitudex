// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SpecialRewardsDistributor
 * @dev Smart contract pour distribuer des rewards ponctuels (quiz, social actions, contests)
 * Système complémentaire au ClaimDistributor pour des rewards "one-time"
 */
contract SpecialRewardsDistributor is Ownable, ReentrancyGuard {
    IERC20 public immutable apxToken;
    
    struct SpecialReward {
        uint256 amount;           // Montant en wei
        uint256 startTime;        // Timestamp de début
        uint256 endTime;          // Timestamp de fin
        bool isActive;            // Actif/inactif
        string rewardType;        // "quiz", "social", "contest", "base_batches"
        string requirements;      // JSON des requirements
        uint256 totalClaimed;     // Total claimé pour ce reward
        uint256 maxClaims;        // Limite max de claims (0 = illimité)
    }
    
    struct UserProgress {
        uint256 totalSpecialClaimed;     // Total APX claimé via special rewards
        uint256 completedRewardsCount;   // Nombre de rewards complétés
    }
    
    // Rewards configurés par l'admin
    mapping(bytes32 => SpecialReward) public specialRewards;
    
    // Tracking des claims par utilisateur et reward
    mapping(address => mapping(bytes32 => bool)) public userClaimedReward;
    
    // Progression utilisateur globale
    mapping(address => UserProgress) public userProgress;
    
    // Progress data pour quiz/challenges (score, réponses, etc.)
    mapping(address => mapping(bytes32 => uint256)) public userProgressData;
    
    // Liste des reward IDs actifs
    bytes32[] public activeRewardIds;
    
    // Events
    event SpecialRewardCreated(bytes32 indexed rewardId, uint256 amount, string rewardType);
    event SpecialRewardClaimed(address indexed user, bytes32 indexed rewardId, uint256 amount);
    event SpecialRewardUpdated(bytes32 indexed rewardId, bool isActive);
    event ProgressUpdated(address indexed user, bytes32 indexed rewardId, uint256 progress);
    event Provisioned(address indexed admin, uint256 amount, uint256 newBalance);
    event EmergencyWithdraw(address indexed admin, uint256 amount);
    
    constructor(address _apxToken, address _owner) Ownable(_owner) {
        require(_apxToken != address(0), "Invalid APX token address");
        require(_owner != address(0), "Invalid owner address");
        
        apxToken = IERC20(_apxToken);
    }
    
    /**
     * @dev Crée un nouveau special reward (admin seulement)
     */
    function createSpecialReward(
        bytes32 rewardId,
        uint256 amount,
        uint256 startTime,
        uint256 endTime,
        string memory rewardType,
        string memory requirements,
        uint256 maxClaims
    ) external onlyOwner {
        require(specialRewards[rewardId].amount == 0, "Reward already exists");
        require(amount > 0, "Amount must be greater than 0");
        require(endTime > startTime, "Invalid time range");
        require(endTime > block.timestamp, "End time must be in future");
        
        specialRewards[rewardId] = SpecialReward({
            amount: amount,
            startTime: startTime,
            endTime: endTime,
            isActive: true,
            rewardType: rewardType,
            requirements: requirements,
            totalClaimed: 0,
            maxClaims: maxClaims
        });
        
        activeRewardIds.push(rewardId);
        
        emit SpecialRewardCreated(rewardId, amount, rewardType);
    }
    
    /**
     * @dev Claim un special reward
     */
    function claimSpecialReward(bytes32 rewardId) external nonReentrant {
        SpecialReward storage reward = specialRewards[rewardId];
        
        require(reward.amount > 0, "Reward does not exist");
        require(reward.isActive, "Reward is not active");
        require(block.timestamp >= reward.startTime, "Reward not yet available");
        require(block.timestamp <= reward.endTime, "Reward has expired");
        require(!userClaimedReward[msg.sender][rewardId], "Already claimed");
        
        // Vérifier la limite de claims si elle existe
        if (reward.maxClaims > 0) {
            require(reward.totalClaimed < reward.maxClaims, "Max claims reached");
        }
        
        // Vérifier les fonds du contract
        require(apxToken.balanceOf(address(this)) >= reward.amount, "Insufficient contract balance");
        
        // Marquer comme claimé
        userClaimedReward[msg.sender][rewardId] = true;
        
        // Mettre à jour les statistiques
        specialRewards[rewardId].totalClaimed += 1;
        userProgress[msg.sender].totalSpecialClaimed += reward.amount;
        userProgress[msg.sender].completedRewardsCount += 1;
        
        // Transfer des tokens
        require(apxToken.transfer(msg.sender, reward.amount), "Transfer failed");
        
        emit SpecialRewardClaimed(msg.sender, rewardId, reward.amount);
    }
    
    /**
     * @dev Met à jour le progress d'un utilisateur pour un reward (pour quiz, challenges)
     */
    function updateUserProgress(
        address user,
        bytes32 rewardId,
        uint256 progressValue
    ) external onlyOwner {
        require(specialRewards[rewardId].amount > 0, "Reward does not exist");
        
        userProgressData[user][rewardId] = progressValue;
        
        emit ProgressUpdated(user, rewardId, progressValue);
    }
    
    /**
     * @dev Active/désactive un reward (admin seulement)
     */
    function toggleRewardStatus(bytes32 rewardId) external onlyOwner {
        require(specialRewards[rewardId].amount > 0, "Reward does not exist");
        
        specialRewards[rewardId].isActive = !specialRewards[rewardId].isActive;
        
        emit SpecialRewardUpdated(rewardId, specialRewards[rewardId].isActive);
    }
    
    /**
     * @dev Met à jour les détails d'un reward (admin seulement)
     */
    function updateRewardDetails(
        bytes32 rewardId,
        uint256 newAmount,
        uint256 newEndTime,
        string memory newRequirements
    ) external onlyOwner {
        require(specialRewards[rewardId].amount > 0, "Reward does not exist");
        require(newEndTime > block.timestamp, "End time must be in future");
        
        specialRewards[rewardId].amount = newAmount;
        specialRewards[rewardId].endTime = newEndTime;
        specialRewards[rewardId].requirements = newRequirements;
        
        emit SpecialRewardUpdated(rewardId, specialRewards[rewardId].isActive);
    }
    
    /**
     * @dev Provisionne le contract avec des tokens APX (admin seulement)
     */
    function provision(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(apxToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        uint256 newBalance = apxToken.balanceOf(address(this));
        emit Provisioned(msg.sender, amount, newBalance);
    }
    
    /**
     * @dev Retrait d'urgence des fonds (admin seulement)
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        uint256 balance = apxToken.balanceOf(address(this));
        require(amount <= balance, "Insufficient balance");
        require(apxToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit EmergencyWithdraw(msg.sender, amount);
    }
    
    // ===== FONCTIONS VIEW =====
    
    /**
     * @dev Retourne la liste des rewards disponibles pour un utilisateur
     */
    function getAvailableRewards(address user) external view returns (bytes32[] memory) {
        uint256 count = 0;
        
        // Compter les rewards disponibles
        for (uint256 i = 0; i < activeRewardIds.length; i++) {
            bytes32 rewardId = activeRewardIds[i];
            if (_isRewardAvailable(user, rewardId)) {
                count++;
            }
        }
        
        // Créer le tableau de résultats
        bytes32[] memory availableRewards = new bytes32[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < activeRewardIds.length; i++) {
            bytes32 rewardId = activeRewardIds[i];
            if (_isRewardAvailable(user, rewardId)) {
                availableRewards[index] = rewardId;
                index++;
            }
        }
        
        return availableRewards;
    }
    
    /**
     * @dev Vérifie si un reward est disponible pour un utilisateur
     */
    function canClaimReward(address user, bytes32 rewardId) external view returns (bool) {
        return _isRewardAvailable(user, rewardId);
    }
    
    /**
     * @dev Retourne les détails d'un reward
     */
    function getRewardDetails(bytes32 rewardId) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        string memory rewardType,
        string memory requirements,
        uint256 totalClaimed,
        uint256 maxClaims
    ) {
        SpecialReward storage reward = specialRewards[rewardId];
        return (
            reward.amount,
            reward.startTime,
            reward.endTime,
            reward.isActive,
            reward.rewardType,
            reward.requirements,
            reward.totalClaimed,
            reward.maxClaims
        );
    }
    
    /**
     * @dev Retourne le progress d'un utilisateur pour un reward
     */
    function getUserProgressData(address user, bytes32 rewardId) external view returns (uint256) {
        return userProgressData[user][rewardId];
    }
    
    /**
     * @dev Retourne le balance du contract
     */
    function getContractBalance() external view returns (uint256) {
        return apxToken.balanceOf(address(this));
    }
    
    /**
     * @dev Retourne le nombre total de rewards actifs
     */
    function getActiveRewardsCount() external view returns (uint256) {
        return activeRewardIds.length;
    }
    
    /**
     * @dev Retourne tous les reward IDs actifs
     */
    function getAllActiveRewardIds() external view returns (bytes32[] memory) {
        return activeRewardIds;
    }
    
    // ===== FONCTIONS INTERNES =====
    
    function _isRewardAvailable(address user, bytes32 rewardId) internal view returns (bool) {
        SpecialReward storage reward = specialRewards[rewardId];
        
        if (reward.amount == 0 || !reward.isActive) return false;
        if (block.timestamp < reward.startTime || block.timestamp > reward.endTime) return false;
        if (userClaimedReward[user][rewardId]) return false;
        if (reward.maxClaims > 0 && reward.totalClaimed >= reward.maxClaims) return false;
        
        return true;
    }
}